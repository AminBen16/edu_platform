# App Icon Placeholder Instructions

## 📱 How to Add Your Custom App Icon

### Step 1: Prepare Your Image
- **Format**: PNG (recommended)
- **Size**: 1024x1024 pixels (minimum)
- **Shape**: Square (1:1 aspect ratio)
- **Background**: Transparent or solid color
- **Design**: Simple, recognizable at small sizes

### Step 2: Replace the Placeholder
1. Save your uploaded image as: `assets/app_icon.png`
2. Make sure it's in the correct location: `apps/mobile/assets/app_icon.png`

### Step 3: Generate App Icons
Run these commands in the mobile app directory:

```bash
cd apps/mobile
flutter pub get
dart run flutter_launcher_icons
```

### Step 4: Update App Name (Optional)
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
android:label="Education Platform"  <!-- Change from "mobile" -->
```

### Step 5: Rebuild the App
```bash
flutter clean
flutter build apk
```

## 🎨 Design Tips
- Keep it simple and clean
- Use high contrast colors
- Avoid too much detail
- Test how it looks at different sizes
- Consider the platform guidelines

## 📁 Icon Locations
After running the launcher icons generator, you'll find icons in:
- `android/app/src/main/res/mipmap-*dpi/` (Android)
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/` (iOS)

## 🔧 Troubleshooting
- If icons don't update: Clean and rebuild the project
- If image is distorted: Ensure it's exactly square
- If icons are blurry: Use a higher resolution source image
