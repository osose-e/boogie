# Boogie - Ride Sharing App for Users with Disabilities

A React Native mobile app built with Expo Go for booking rides on the Stanford college campus, with a focus on accessibility and voice input.

## Features

- **Screen Reader Accessible**: All components include proper accessibility labels and roles
- **Voice Input**: Conversational interface for selecting destinations via voice
- **Stanford Campus Focus**: Pre-configured locations for Stanford campus
- **Accessibility Options**: Wheelchair accessibility toggle and special requests
- **Complete Booking Flow**: From location selection to ride confirmation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app installed on your iOS or Android device
- For iOS: Xcode (for iOS simulator) or Expo Go app
- For Android: Android Studio (for Android emulator) or Expo Go app

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Scan the QR code with:
   - **iOS**: Camera app or Expo Go app
   - **Android**: Expo Go app

## Project Structure

```
Boogie/
├── App.js                 # Main app entry point with navigation
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js              # Home screen with location search
│   │   ├── VoiceInputScreen.js        # Voice input conversation interface
│   │   ├── RideRegistrationScreen.js # Ride details form
│   │   └── RideConfirmationScreen.js  # Booking confirmation
│   ├── components/
│   │   ├── CancelConfirmationModal.js    # Cancel booking modal
│   │   └── FinalizeConfirmationModal.js # Finalize booking modal
│   ├── constants/
│   │   └── stanfordLocations.js       # Stanford campus locations
│   └── styles/
│       └── colors.js                  # Color theme
└── package.json
```

## App Flow

1. **Home Screen**: Browse or search for Stanford campus locations
2. **Voice Input Screen**: Use voice or text to specify dropoff location details
3. **Ride Registration**: Set pickup time, review locations, add notes, set accessibility needs
4. **Ride Confirmation**: View booking confirmation with all details

## Accessibility Features

- All interactive elements have proper `accessibilityLabel` and `accessibilityRole` props
- Screen reader announcements for important actions
- Text-to-speech for bot responses in voice input screen
- High contrast colors and clear visual hierarchy
- Keyboard navigation support

## Voice Input

The app includes a simulated voice input interface that works with Expo Go. In production, you would integrate with:
- Web Speech API (for web)
- Native speech recognition APIs (for iOS/Android)
- Third-party services like Google Cloud Speech-to-Text

Currently, the voice input screen includes:
- Text input fallback for Expo Go compatibility
- Simulated conversation flow
- Text-to-speech responses using Expo Speech

## Notes

- This app is designed for Expo Go and uses Expo-compatible libraries only
- Voice recognition is simulated for Expo Go compatibility
- In production, you would need to integrate with actual speech recognition services
- The app focuses on the booking flow only (no authentication screens)

## Development

To run on a specific platform:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## License

Private project
