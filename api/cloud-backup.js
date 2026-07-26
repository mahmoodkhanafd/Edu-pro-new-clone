const { Pool } = require('pg');

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

let pool;
let tablesReady;

function getPool() {
  if (!databaseUrl) {
    throw new Error('NEON_DATABASE_URL or DATABASE_URL is required for cloud backup.');
  }

  if (!pool) {
    const needsSsl =
      databaseUrl.includes('neon.tech') ||
      databaseUrl.includes('sslmode=require') ||
      databaseUrl.includes('vercel-storage.com');

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

async function ensureTables() {
  if (!tablesReady) {
    tablesReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS edupro_cloud_users (
        id BIGSERIAL PRIMARY KEY,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE,
        name TEXT,
        photo TEXT,
        role TEXT DEFAULT 'admin',
        provider TEXT DEFAULT 'google',
        last_login TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS edupro_cloud_backups (
        id BIGSERIAL PRIMARY KEY,
        backup_key TEXT NOT NULL UNIQUE,
        google_id TEXT,
        email TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_edupro_cloud_backups_google_id
        ON edupro_cloud_backups (google_id);
      CREATE INDEX IF NOT EXISTS idx_edupro_cloud_backups_email
        ON edupro_cloud_backups (LOWER(email));
    `);
  }

  return tablesReady;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function parseGoogleId(value) {
  if (!value || typeof value !== 'string') return null;
  return value.startsWith('google-') ? value.slice('google-'.length) : value;
}

function getSingleQueryValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeUser(body) {
  const source = body.googleUser || body.user || {};
  const rawGoogleId =
    body.googleId ||
    source.googleId ||
    source.sub ||
    source.id ||
    null;
  const googleId = parseGoogleId(rawGoogleId);

  return {
    googleId,
    email: source.email || body.email || null,
    name: source.name || body.name || null,
    photo: source.photo || source.picture || body.photo || null,
    role: source.role || body.role || 'admin',
    provider: source.provider || body.provider || 'google',
  };
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function getBackup(req, res) {
  const query = req.query || Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
  const key = getSingleQueryValue(query.key || query.backupKey);
  const googleId = parseGoogleId(getSingleQueryValue(query.googleId || query.google_id));
  const email = getSingleQueryValue(query.email);

  if (!key && !googleId && !email) {
    return sendJson(res, 400, {
      ok: false,
      error: 'Provide key, googleId, or email to fetch a backup.',
    });
  }

  await ensureTables();

  let result;
  if (key) {
    result = await getPool().query(
      `SELECT backup_key, google_id, email, data, created_at, updated_at
       FROM edupro_cloud_backups
       WHERE backup_key = $1
       LIMIT 1`,
      [key]
    );
  }

  if ((!result || !result.rows.length) && googleId && email) {
    result = await getPool().query(
      `SELECT backup_key, google_id, email, data, created_at, updated_at
       FROM edupro_cloud_backups
       WHERE google_id = $1 OR LOWER(email) = LOWER($2)
       ORDER BY updated_at DESC
       LIMIT 1`,
      [googleId, email]
    );
  } else if ((!result || !result.rows.length) && googleId) {
    result = await getPool().query(
      `SELECT backup_key, google_id, email, data, created_at, updated_at
       FROM edupro_cloud_backups
       WHERE google_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [googleId]
    );
  } else if ((!result || !result.rows.length) && email) {
    result = await getPool().query(
      `SELECT backup_key, google_id, email, data, created_at, updated_at
       FROM edupro_cloud_backups
       WHERE LOWER(email) = LOWER($1)
       ORDER BY updated_at DESC
       LIMIT 1`,
      [email]
    );
  }

  if (!result || !result.rows.length) {
    return sendJson(res, 200, { ok: true, found: false });
  }

  const row = result.rows[0];
  return sendJson(res, 200, {
    ok: true,
    found: true,
    backupKey: row.backup_key,
    googleId: row.google_id,
    email: row.email,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

async function postBackup(req, res) {
  const body = await readBody(req);
  const user = normalizeUser(body);
  const backupKey = body.backupKey || body.key || user.googleId || user.email;
  const data = body.data;

  if (!backupKey) {
    return sendJson(res, 400, {
      ok: false,
      error: 'backupKey is required when the Google profile has no id/email.',
    });
  }

  if (data === undefined || data === null) {
    return sendJson(res, 400, {
      ok: false,
      error: 'data JSON is required.',
    });
  }

  await ensureTables();
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    if (user.googleId) {
      await client.query(
        `INSERT INTO edupro_cloud_users
          (google_id, email, name, photo, role, provider, last_login, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (google_id) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, edupro_cloud_users.email),
          name = COALESCE(EXCLUDED.name, edupro_cloud_users.name),
          photo = COALESCE(EXCLUDED.photo, edupro_cloud_users.photo),
          role = COALESCE(EXCLUDED.role, edupro_cloud_users.role),
          provider = COALESCE(EXCLUDED.provider, edupro_cloud_users.provider),
          last_login = NOW(),
          updated_at = NOW()`,
        [user.googleId, user.email, user.name, user.photo, user.role, user.provider]
      );
    } else if (user.email) {
      await client.query(
        `INSERT INTO edupro_cloud_users
          (email, name, photo, role, provider, last_login, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, edupro_cloud_users.name),
          photo = COALESCE(EXCLUDED.photo, edupro_cloud_users.photo),
          role = COALESCE(EXCLUDED.role, edupro_cloud_users.role),
          provider = COALESCE(EXCLUDED.provider, edupro_cloud_users.provider),
          last_login = NOW(),
          updated_at = NOW()`,
        [user.email, user.name, user.photo, user.role, user.provider]
      );
    }

    const backupResult = await client.query(
      `INSERT INTO edupro_cloud_backups
        (backup_key, google_id, email, data, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT (backup_key) DO UPDATE SET
        google_id = COALESCE(EXCLUDED.google_id, edupro_cloud_backups.google_id),
        email = COALESCE(EXCLUDED.email, edupro_cloud_backups.email),
        data = EXCLUDED.data,
        updated_at = NOW()
       RETURNING backup_key, google_id, email, created_at, updated_at`,
      [backupKey, user.googleId, user.email, JSON.stringify(data)]
    );

    await client.query('COMMIT');

    const row = backupResult.rows[0];
    return sendJson(res, 200, {
      ok: true,
      backupKey: row.backup_key,
      googleId: row.google_id,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = async function cloudBackupHandler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    if (req.method === 'GET') return await getBackup(req, res);
    if (req.method === 'POST') return await postBackup(req, res);

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  } catch (error) {
    console.error('Cloud backup API error:', error);
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Cloud backup failed.',
    });
  }
};
