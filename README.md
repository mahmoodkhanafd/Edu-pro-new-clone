# EduPro School Management System

Complete school management app for Android, iOS, and Web — built with Next.js and packaged as a native APK via Capacitor.

## Highlights

- **Single codebase** for Android, iOS, and web (Next.js static export → Capacitor WebView)
- **APK size ~5.4 MB** — that's normal for a web-based app. Play Store's 60–90 MB apps are native Java/Kotlin with bundled translations and density-specific image sets
- **Students, fees, attendance, staff, payroll, expenses, exams, DMC, ID cards, SMS, settings**
- **Cloud backup** to Neon Postgres (per-user, signed in with Google)
- **Offline-first** — every screen works without internet; cloud backup is a separate step

## Tech

- Next.js 16, React 19, Tailwind v4
- Zustand (state) + localStorage (persistence)
- Capacitor 8 (Android) + @capacitor/share + @capacitor/filesystem
- jsPDF + html2canvas (PDF export, with Tailwind v4 oklch() colour flattening)
- qrcode (ID card QR codes)
- Drizzle ORM (server-side cloud backup, Vercel serverless function)

## Build

```bash
npm ci
npm run build        # static export to ./out
npm run android:sync # copy ./out into android/app/src/main/assets
cd android && ./gradlew assembleDebug
```

Or one-shot:

```bash
npm run android:apk
```

APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

## GitHub Actions

`.github/workflows/android-apk.yml` builds the debug APK on every push to `main`. Download from **Actions → EduPro-Android-Debug-APK artifact**.

## Google Sign-In

> **Important:** EduPro runs inside a Capacitor **WebView**, not native Android.
> So it needs a **Web OAuth Client ID**, not an Android one.
> Full step-by-step guide: **[docs/GOOGLE_SIGNIN_SETUP.md](docs/GOOGLE_SIGNIN_SETUP.md)**

To make the Google account chooser appear without any in-app setup:
1. Create a **Web application** OAuth Client in Google Cloud Console
2. Add `http://localhost` and your Vercel domain to **Authorized JavaScript origins**
3. Add a GitHub repo variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with the client ID
4. Next APK build will bake it in — the user never sees the paste prompt

## SHA-1 fingerprint helper

For the rare case where you need the debug keystore SHA-1 (e.g. native Android
Google Sign-In or Firebase), use the helper script:

```bash
# macOS / Linux
./scripts/get-sha1.sh

# Windows
scripts\get-sha1.bat
```

Note: **Web OAuth Client (which EduPro uses) does not need SHA-1.**

## Layout

```
src/
  app/                 # Next.js App Router pages
    students/id-cards/ # ID card generator
    exams/dmc/         # Detailed Marks Certificate
    exams/marks/       # Enter exam marks
    login/             # Login (Guest, Admin, Sign Up, Google)
    settings/          # School settings, theme, backup
  components/
    Layout.tsx         # Sidebar + sticky header
  store/
    index.ts           # Zustand store (students, classes, fees, exams, …)
  utils/
    pdf.ts             # jsPDF + html2canvas wrapper (PDF + print)
    googleAuth.ts      # Google Identity Services (Web)
    cloudBackup.ts     # Neon Postgres per-user backup
    deviceStorage.ts   # Capacitor Filesystem helpers
android/               # Capacitor Android project
docs/
  GOOGLE_SIGNIN_SETUP.md
scripts/
  get-sha1.sh
  get-sha1.bat
```

## License

Proprietary — internal EduPro project.
