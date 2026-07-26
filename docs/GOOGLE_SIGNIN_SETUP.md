# Google Sign-In Setup (Capacitor WebView)

> **Quick answer:** Aapne screenshot mein jo **Android OAuth Client** banaya, woh kaam
> **nahi karega**. EduPro Capacitor (WebView) hai, toh **Web OAuth Client ID** chahiye.
> Pichhle session mein maine yeh saaf nahi bataya tha — galti meri thi.

---

## 1. Capacitor WebView vs Native Android — farq kya hai?

EduPro ka Android app **Capacitor** par bana hai. Capacitor ka matlab:

- Aapka pura code **HTML + CSS + JavaScript** (Next.js static export) hai
- Capacitor us code ko Android ke **WebView** (Chrome browser engine) ke andar load karta hai
- Yeh **hybrid app** hai — Play Store par publish hoti hai lekin andar web chal rahi hoti hai

Iska matlab:
- Native APIs (Camera, Filesystem) Capacitor plugins se milte hain — woh native bridge ka kaam hai
- OAuth, jaise Google sign-in, **Web APIs** hain aur WebView ke andar **bilkul waise hi** chalti hain jaise Chrome browser mein
- **Google account chooser** Google ki web library (`accounts.google.com/gsi/client`) khulti hai — iske liye **Web OAuth Client ID** chahiye

### Play Store ke liye kya best hai?

| Approach | Pros | Cons |
|---|---|---|
| **Capacitor (current)** | Ek codebase, web + Android + iOS, fast updates | WebView performance native se thoda kam |
| React Native / Flutter | Pure native UI, fast | Alag codebase, learning curve |
| Pure Kotlin/Java | Best performance | Bohot zyada kaam, alag iOS team |

Capacitor **school management app** jaise use-case ke liye best hai — data entry forms + tables + simple UI, jahan native UI speed farak nahi karta. **Play Store par publish ho sakti hai, size 5-6 MB, ek codebase se Android + iOS + Web**.

---

## 2. Sahi Google OAuth Client banana

### Step A: Wapas Google Cloud Console → Credentials

1. https://console.cloud.google.com → **APIs & Services** → **Credentials**
2. **Jo "Android client 1" aapne abhi banaya hai, usse DELETE karein** — woh kaam nahi karega
3. **+ Create Credentials** → **OAuth client ID** click karein

### Step B: Consent Screen pehle (agar pehli baar hai)

Agar pehle "Configure consent screen" maange toh:
- User type: **External** (testing ke liye)
- App name: `EduPro School System`
- Support email: aapka email
- Developer contact: aapka email
- Scopes: `email`, `profile`, `openid` (defaults)
- Test users: aapka khud ka Google account add karein (taake testing mein kaam kare)

### Step C: OAuth Client ID create karein

**Application type: `Web application`** ← YEH SELECT KAREIN (Android NAHI)

Name: `EduPro Web Client`

**Authorized JavaScript origins** mein add karein (ek-ek karke):
- `http://localhost` — local development ke liye
- `http://localhost:3000` — Next.js dev server
- `https://YOUR-VERCEL-DOMAIN.vercel.app` — aapka production web app (agar Vercel par deploy hai)

**Authorized redirect URIs** khaali chhor dein (token client ke liye zaroorat nahi).

**Create** press karein → aapko ek Client ID milega:
```
123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

### Step D: Client ID APK mein inject karein

**Option 1 (recommended — naye APK har baar Client ID ke saath banta hai):**
- GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** tab
- **New repository variable**:
  - Name: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - Value: woh Client ID jo aapko mila
- Save karein
- Ab jab bhi `main` branch par push hoga, GitHub Actions Client ID build mein inject karega
- APK mein kabhi paste nahi karna padega

**Option 2 (jaldi testing — har device par ek dafa):**
- App kholein → Login screen
- "Continue with Google Account" par click karein
- Prompt aayega: "Paste your Google OAuth Client ID (one time only)"
- Client ID paste karein → "Save & Continue"
- Ab Google account chooser khulega

---

## 3. SHA-1 certificate fingerprint — kya hai aur kab chahiye?

**SHA-1 fingerprint** ek unique ID hai aapki app ke signing certificate ka. Google isko sirf **Android OAuth Client** ke liye maangta hai — woh ensure karta hai ke OAuth request aapki hi app se aa rahi hai.

**Web OAuth Client ke liye SHA-1 ki zaroorat NAHI hoti.** Sirf JavaScript origins set karne se kaam ho jata hai.

### Kab SHA-1 chahiye?

| Scenario | SHA-1 chahiye? |
|---|---|
| Google sign-in in WebView (current) | ❌ Nahi — Web Client use ho raha hai |
| Native Android Google Sign-In SDK (alag library) | ✅ Haan — Android Client ke saath |
| Firebase Authentication phone auth | ✅ Haan |
| Google Maps API key (Android) | ✅ Haan |
| Play Store listing | ✅ Haan — release keystore ka Play App Signing se |

### Agar kabhi SHA-1 nikalna ho (debug keystore)

Debug keystore Gradle pehli build par automatically banata hai. Command:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
```

Ya Gradle se APK build karne ke baad:
```bash
# macOS / Linux
keytool -list -v -keystore ~/.android/debug.keystore -storepass android | grep SHA1

# Windows
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -storepass android | findstr SHA1
```

Output mein dikhega:
```
SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
```

Yeh `AB:CD:EF:...` Android OAuth Client ke "SHA-1 certificate fingerprint" field mein paste hota hai — **lekin sirf tab jab aap native Android sign-in use karein**, jo abhi hum nahi kar rahe.

---

## 4. Summary

1. ❌ Jo **Android OAuth Client** aapne abhi banaya — usse **delete** karein
2. ✅ **Web OAuth Client** banayein (Authorized JavaScript origins mein `http://localhost` add karein)
3. ✅ Client ID GitHub Variables mein `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ke taur par save karein
4. ✅ Next APK build par Google sign-in seedha kaam karega — bina paste ke
