# Quick Start Guide - Expo Go

## Prerequisites
- Node.js installed (v16 or higher)
- Expo Go app installed on your phone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npm start
   ```
   
   This will open Expo DevTools in your browser and show a QR code.

3. **Run on your device:**
   - **iOS**: Open the Camera app and scan the QR code, or open Expo Go and scan the QR code
   - **Android**: Open the Expo Go app and scan the QR code

4. **Alternative - Run on simulator/emulator:**
   - Press `i` for iOS simulator (requires Xcode)
   - Press `a` for Android emulator (requires Android Studio)

## Troubleshooting

- If you see "Unable to resolve module" errors, try:
  ```bash
  rm -rf node_modules
  npm install
  ```

- If the QR code doesn't work, make sure your phone and computer are on the same WiFi network

- For voice input: The app uses text input as a fallback for Expo Go compatibility. In production, you would integrate with native speech recognition APIs.

## Project Structure

- All screens are in `src/screens/`
- Components are in `src/components/`
- Constants (like Stanford locations) are in `src/constants/`
- Styles are in `src/styles/`

## Testing the App Flow

1. **Home Screen**: Browse locations or tap the microphone button
2. **Voice Input**: Type your destination (e.g., "I want to go to coda")
3. **Ride Registration**: Fill in details and toggle wheelchair accessibility if needed
4. **Confirmation**: Review and confirm your booking

Enjoy testing Boogie! 🚗
