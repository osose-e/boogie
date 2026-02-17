# Expo Speech and Screen Reader Compatibility

## How Expo Speech Works

`expo-speech` uses the device's **built-in Text-to-Speech (TTS) engine** to speak text aloud. It's a separate system from screen readers.

### Technical Details:

- **iOS**: Uses `AVSpeechSynthesizer` (same engine as Siri)
- **Android**: Uses the system TTS engine (Google TTS)
- **Web**: Uses Web Speech API's `speechSynthesis`

## Screen Reader Interaction

### Will it interfere?

**Yes, potentially.** Here's what happens:

1. **Both can speak simultaneously**: If a screen reader is reading something and `expo-speech` starts speaking, you'll hear **both voices at the same time** - this is confusing and inaccessible.

2. **Screen readers pause TTS**: On iOS, VoiceOver can interrupt `expo-speech`. On Android, TalkBack may pause it. But this isn't guaranteed.

3. **User confusion**: Users may not know which voice is from the app vs. the screen reader.

## Current Implementation Issue

In your `VoiceInputScreen.js`, `speakResponse()` is called automatically when the bot responds:

```javascript
const speakResponse = (text) => {
  Speech.speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.9,
  });
};
```

**Problem**: If a user has a screen reader enabled, they'll hear:
- Screen reader reading the text on screen
- `expo-speech` speaking the same text
- **Result**: Double audio, confusing experience

## Best Practices for Accessibility

### Option 1: Check if Screen Reader is Active (Recommended)

Only use `expo-speech` when screen reader is NOT active:

```javascript
import { AccessibilityInfo } from 'react-native';

const speakResponse = async (text) => {
  // Check if screen reader is active
  const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
  
  if (!isScreenReaderEnabled) {
    // Only speak if screen reader is off
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  }
  // If screen reader is on, it will read the text automatically
};
```

### Option 2: Make it User-Controlled

Add a setting to let users choose:

```javascript
const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

const speakResponse = async (text) => {
  const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
  
  if (audioFeedbackEnabled && !isScreenReaderEnabled) {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  }
};
```

### Option 3: Use Accessibility Announcements Instead

For screen reader users, use React Native's accessibility announcements:

```javascript
import { AccessibilityInfo } from 'react-native';

const announceResponse = (text) => {
  AccessibilityInfo.announceForAccessibility(text);
};

// This works better with screen readers
// It queues properly and doesn't conflict
```

## Recommended Solution

**Best approach**: Use a combination:

```javascript
import { AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';

const speakResponse = async (text) => {
  const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
  
  if (isScreenReaderEnabled) {
    // Use accessibility announcement for screen reader users
    AccessibilityInfo.announceForAccessibility(text);
  } else {
    // Use expo-speech for users without screen readers
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  }
};
```

## How Screen Readers Work

### iOS VoiceOver:
- Reads all text on screen automatically
- Reads when content changes
- Can be controlled with gestures
- Uses its own TTS engine

### Android TalkBack:
- Similar to VoiceOver
- Reads content as user navigates
- Can announce dynamic content changes
- Uses system TTS

### Key Point:
Screen readers **already read the text** that appears on screen. You don't need `expo-speech` to read it again - that causes duplication.

## When to Use Expo Speech

Use `expo-speech` when:
- ✅ Screen reader is **not** active
- ✅ You want audio feedback for visual users
- ✅ You want to provide audio cues (like "listening..." or "processing...")
- ✅ You want to read text that's NOT visible on screen

Don't use `expo-speech` when:
- ❌ Screen reader is active (it will conflict)
- ❌ The text is already visible and will be read by screen reader
- ❌ You want to avoid audio conflicts

## Testing Recommendations

1. **Test with VoiceOver (iOS)**:
   - Settings > Accessibility > VoiceOver > On
   - Navigate your app
   - Listen for double audio

2. **Test with TalkBack (Android)**:
   - Settings > Accessibility > TalkBack > On
   - Navigate your app
   - Check for conflicts

3. **Test without screen reader**:
   - Make sure `expo-speech` still works
   - Verify audio feedback is helpful

## Implementation Example

Here's how to update your `VoiceInputScreen.js`:

```javascript
import { AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';

const VoiceInputScreen = ({ navigation, route }) => {
  // ... existing code ...

  const speakResponse = async (text) => {
    try {
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      if (isScreenReaderEnabled) {
        // Screen reader will read the text automatically
        // Just announce it for immediate feedback
        AccessibilityInfo.announceForAccessibility(text);
      } else {
        // No screen reader - use TTS for audio feedback
        Speech.speak(text, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
        });
      }
    } catch (error) {
      console.error('Error with speech:', error);
      // Fallback: just announce it
      AccessibilityInfo.announceForAccessibility(text);
    }
  };

  // ... rest of your code ...
};
```

## Summary

- **expo-speech** uses device TTS (separate from screen readers)
- **Can conflict** if both speak at once
- **Solution**: Check if screen reader is active before using `expo-speech`
- **Better**: Use `AccessibilityInfo.announceForAccessibility()` for screen reader users
- **Best**: Combine both approaches based on screen reader status

This ensures a good experience for both screen reader users and visual users who want audio feedback.
