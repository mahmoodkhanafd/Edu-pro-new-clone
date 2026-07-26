'use client';

const BACKUP_DIR = 'EduPro/Backups';
const LATEST_BACKUP_FILE = 'edupro-backup-latest.json';

function makeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function isBrowserRuntime() {
  return typeof window !== 'undefined';
}

export async function isCapacitorAndroid() {
  if (!isBrowserRuntime()) return false;

  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

async function getFilesystemModules() {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  return { Filesystem, Directory, Encoding };
}

async function ensureBackupDirectory() {
  const { Filesystem, Directory } = await getFilesystemModules();

  try {
    await Filesystem.mkdir({
      path: BACKUP_DIR,
      directory: Directory.Documents,
      recursive: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('exist')) {
      // Some Android versions return an error when the directory already exists.
      // Verify by trying to stat it before treating the mkdir as a real failure.
      await Filesystem.stat({ path: BACKUP_DIR, directory: Directory.Documents });
    }
  }
}

export async function saveBackupToDocuments(
  dataJson: string,
  options: { timestamped?: boolean } = {}
) {
  if (!(await isCapacitorAndroid())) {
    throw new Error('Documents backup is available inside the Android app only.');
  }

  const { Filesystem, Directory, Encoding } = await getFilesystemModules();
  await ensureBackupDirectory();

  const latestPath = `${BACKUP_DIR}/${LATEST_BACKUP_FILE}`;
  await Filesystem.writeFile({
    path: latestPath,
    directory: Directory.Documents,
    data: dataJson,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  let timestampedPath: string | undefined;
  if (options.timestamped) {
    timestampedPath = `${BACKUP_DIR}/edupro-backup-${makeTimestamp()}.json`;
    await Filesystem.writeFile({
      path: timestampedPath,
      directory: Directory.Documents,
      data: dataJson,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  return {
    latestPath: `Documents/${latestPath}`,
    timestampedPath: timestampedPath ? `Documents/${timestampedPath}` : undefined,
  };
}

export async function readLatestBackupFromDocuments() {
  if (!(await isCapacitorAndroid())) {
    throw new Error('Documents import is available inside the Android app only.');
  }

  const { Filesystem, Directory, Encoding } = await getFilesystemModules();
  const result = await Filesystem.readFile({
    path: `${BACKUP_DIR}/${LATEST_BACKUP_FILE}`,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });

  if (typeof result.data === 'string') return result.data;

  return await result.data.text();
}

export async function shareLatestBackupFromDocuments() {
  if (!(await isCapacitorAndroid())) {
    throw new Error('Sharing a Documents backup is available inside the Android app only.');
  }

  const { Filesystem, Directory } = await getFilesystemModules();
  const { Share } = await import('@capacitor/share');
  const uri = await Filesystem.getUri({
    path: `${BACKUP_DIR}/${LATEST_BACKUP_FILE}`,
    directory: Directory.Documents,
  });

  await Share.share({
    title: 'EduPro Latest Backup',
    text: 'EduPro latest JSON backup',
    url: uri.uri,
    dialogTitle: 'Share EduPro latest backup',
  });

  return `Documents/${BACKUP_DIR}/${LATEST_BACKUP_FILE}`;
}
