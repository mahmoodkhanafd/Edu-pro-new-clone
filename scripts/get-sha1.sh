#!/usr/bin/env bash
# Print the SHA-1 fingerprints for the Android debug keystore.
# Useful when you need to register an Android OAuth Client ID with Google.
#
# Web OAuth Client IDs (the one EduPro uses today) do NOT need SHA-1.
# This script is for the rare case where you add native Android sign-in later.

set -euo pipefail

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  KEYSTORE="$USERPROFILE/.android/debug.keystore"
else
  KEYSTORE="$HOME/.android/debug.keystore"
fi

if [[ ! -f "$KEYSTORE" ]]; then
  echo "Debug keystore not found at: $KEYSTORE"
  echo "Build the Android project at least once so Gradle creates one:"
  echo "  npm run android:apk"
  exit 1
fi

echo "SHA-1 fingerprints from: $KEYSTORE"
echo "---"
keytool -list -v -keystore "$KEYSTORE" -alias androiddebugkey -storepass android 2>/dev/null \
  | grep -E "SHA1|SHA-1" || keytool -list -v -keystore "$KEYSTORE" -alias androiddebugkey -storepass android
