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

## Voice Input & Boogie Bot

The voice input screen is wired to **BoogieBot**, a conversational dispatcher that understands Stanford campus locations, entrances (north, south, east, west, etc.), and landmarks (e.g. “near the Blend”, “by the stairs”, “bike racks”) so drivers can find riders precisely.

- **OpenAI**: Bot uses the OpenAI API for natural language. Set `EXPO_PUBLIC_OPENAI_API_KEY` in `.env` (same value as `OPENAI_API_KEY`; Expo only exposes `EXPO_PUBLIC_*` in the client).
- **Overpass (optional)**: Campus building/amenity context from OpenStreetMap is fetched once per session to improve location understanding.
- **Flow**: User types or uses the keyboard mic; BoogieBot replies with confirmations and asks about entrances/landmarks when needed. Resolved drop-off is passed to the ride registration screen.

The app also supports:
- Text input fallback for Expo Go
- Text-to-speech and “Read Messages” for accessibility

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