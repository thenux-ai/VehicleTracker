# 🚗 Vehicle Tracker APK - Build Guide (සිංහල)
## ඔයාගේම APK file හදාගන්නා ක්‍රමය

---

## 📁 Files Structure
```
VehicleTracker/
├── App.js          ← Main app code (සියලු features)
├── package.json    ← Dependencies list
├── app.json        ← App settings (name, icon)
└── eas.json        ← APK build settings
```

---

## 🛠️ STEP 1: Node.js Install කරන්න (Computer එකේ)

1. **https://nodejs.org** යන්න
2. **"LTS" version** download කරන්න (green button)
3. Install කරන්න (Next > Next > Finish)
4. Verify: Command Prompt open කරලා type කරන්න:
   ```
   node --version
   ```
   `v20.x.x` වගේ දෙයක් show වෙනවා නම් හරි ✅

---

## 🛠️ STEP 2: Expo CLI Install කරන්න

Command Prompt (cmd) එකේ type කරන්න:
```bash
npm install -g expo-cli eas-cli
```
⏳ මිනිත්තු 2-3ක් ගනී

---

## 🛠️ STEP 3: Project Setup කරන්න

```bash
# 1. Folder හදන්න
mkdir VehicleTracker
cd VehicleTracker

# 2. Files copy කරන්න (App.js, package.json, app.json, eas.json)
#    (ඔයාට දුන්නු files 4ම මේ folder එකට paste කරන්න)

# 3. Dependencies install කරන්න
npm install
```
⏳ මිනිත්තු 5ක් ගනී

---

## 🛠️ STEP 4: Expo Account හදන්න (Free)

1. **https://expo.dev** යන්න
2. **"Sign Up"** → Email + Password (free account)
3. CMD එකේ login වෙන්න:
   ```bash
   eas login
   ```
   Email + Password type කරන්න

---

## 🛠️ STEP 5: APK Build කරන්න ☁️

```bash
eas build -p android --profile preview
```

**Questions 2ක් ඇහුවොත්:**
- `Generate a new Android Keystore?` → **Y** press කරන්න
- `Would you like to automatically increment?` → **Y** press කරන්න

⏳ **Cloud server එකේ build වෙනවා — මිනිත්තු 10-15ක් ගනී**

---

## 🛠️ STEP 6: APK Download කරන්න

Build complete වූ විට CMD එකේ **link** එකක් දෙනවා:
```
✅ Build finished.
🔗 https://expo.dev/artifacts/eas/xxxxx.apk
```

1. ඒ link එකෙන් **APK download** කරන්න
2. **Phone එකට transfer** කරන්න (USB/WhatsApp/Gmail)

---

## 🛠️ STEP 7: Phone එකේ Install කරන්න

**Settings > Security > Unknown Sources > ON** කරන්න

එහෙමත් නැත්නම්:
**Settings > Apps > Special App Access > Install Unknown Apps > Files > Allow**

APK file open කරලා **Install** click කරන්න ✅

---

## 📱 App Use කරන ක්‍රමය

1. App open කරන්න → ඔයාගේ **30 vehicles** list show වෙනවා
2. Vehicle card එකක **✏️ Edit** touch කරන්න
3. **License date** සහ **Insurance date** pick කරන්න
4. **💾 Save** touch කරන්න
5. **Reminder automatically set** වෙනවා! (දින 14කට කලින් notification ලැබෙනවා)

---

## 🔔 Notifications

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 Green | 14+ දින | Safe |
| 🟠 Orange | 0-14 දින | Reminder zone! |
| 🔴 Red | Expired | Action needed |

---

## ❓ Problems වුනොත්

**"eas: command not found"**
```bash
npm install -g eas-cli
```

**Build fail වුනොත්**
```bash
expo doctor
```
ඒකෙන් show වෙන errors fix කරන්න

**Notifications නොලැබෙනවා නම්:**
Settings > Apps > Vehicle Tracker > Notifications > Allow
Battery > Don't Optimize

---

## 💡 Tips

- App **background** එකේ run වෙනකොළු notifications ලැබෙනවා
- Data **phone storage** (AsyncStorage) එකේ save වෙනවා
- Phone format කළොත් data යයි — export feature future update එකේ add කරන්න පුළුවන්
- **eas.json** `"buildType": "apk"` → direct install කරන APK file