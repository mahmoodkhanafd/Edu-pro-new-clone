@echo off
REM Print the SHA-1 fingerprints for the Android debug keystore.
REM Useful when you need to register an Android OAuth Client ID with Google.
REM
REM Web OAuth Client IDs (the one EduPro uses today) do NOT need SHA-1.
REM This script is for the rare case where you add native Android sign-in later.

setlocal

set KEYSTORE=%USERPROFILE%\.android\debug.keystore

if not exist "%KEYSTORE%" (
  echo Debug keystore not found at: %KEYSTORE%
  echo Build the Android project at least once so Gradle creates one:
  echo   npm run android:apk
  exit /b 1
)

echo SHA-1 fingerprints from: %KEYSTORE%
echo ---
keytool -list -v -keystore "%KEYSTORE%" -alias androiddebugkey -storepass android
