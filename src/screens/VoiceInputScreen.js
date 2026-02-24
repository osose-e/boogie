import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { colors } from '../styles/colors';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { getOpenAIApiKey } from '../config';
import { getInitialBotMessage, processBoogieBotTurn } from '../services/boogieBotApi';

const VoiceInputScreen = ({ navigation, route }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedPickup, setResolvedPickup] = useState(null);
  const [resolvedDropoff, setResolvedDropoff] = useState(null);
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const messageRefs = useRef({});
  const conversationHeaderRef = useRef(null);
  const logoRef = useRef(null);
  const initializedRef = useRef(false);
  const botStateRef = useRef({ phase: 'pickup', resolvedPickup: null, resolvedDropoff: null });
  const [currentLocation, setCurrentLocation] = useState(null);

  // Request location permission and get current position (foreground)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled || status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled && pos?.coords) {
          setCurrentLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            displayName: 'Current location',
          });
        }
      } catch (e) {
        if (!cancelled) console.warn('Location error:', e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Initialize conversation: ask about pickup first
  useEffect(() => {
    if (!initializedRef.current && transcript.length === 0) {
      initializedRef.current = true;
      const initialBotMessage = getInitialBotMessage();
      const uniqueTimestamp = Date.now() + Math.random();
      setTranscript([{
        type: 'bot',
        text: initialBotMessage,
        highlights: [],
        timestamp: uniqueTimestamp,
      }]);
    }
  }, []);

  // Focus on logo when screen loads
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = findNodeHandle(logoRef.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Focus on conversation header when messages are added (but not on initial load)
  useEffect(() => {
    if (transcript.length > 1) { // Only after initial message
      const raf = requestAnimationFrame(() => {
        const node = findNodeHandle(conversationHeaderRef.current);
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [transcript.length]);

  // Dismiss keyboard when tapping outside
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Keyboard.dismiss();
    });
    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  // Simulated voice input for Expo Go compatibility
  // In a production app, you would integrate with a speech recognition API

  const addUserMessage = (text) => {
    // Ensure unique timestamp by adding a small random offset
    const timestamp = Date.now() + Math.random();
    setTranscript((prev) => [
      ...prev,
      { type: 'user', text, timestamp },
    ]);
  };

  const addBotMessage = (text, highlights = []) => {
    // Ensure unique timestamp by adding a small random offset
    const timestamp = Date.now() + Math.random();
    setTranscript((prev) => [
      ...prev,
      { type: 'bot', text, highlights, timestamp },
    ]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      // Focus on the new message for screen readers
      const raf = requestAnimationFrame(() => {
        const node = findNodeHandle(messageRefs.current[timestamp]);
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }
      });
    }, 100);
  };

  const processVoiceInput = async (input) => {
    const trimmed = (input || '').trim();
    if (!trimmed) return;

    setIsProcessing(true);
    const timeoutId = setTimeout(() => {
      setIsProcessing(false); // safety: never stay stuck if API hangs
    }, 25000);
    try {
      const conversationHistory = transcript
        .filter((m) => m.type === 'user' || m.type === 'bot')
        .map((m) => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.text || '',
        }));
      const result = await processBoogieBotTurn(botStateRef.current, trimmed, {
        openAiApiKey: getOpenAIApiKey() || undefined,
        currentLocation: currentLocation ?? undefined,
        conversationHistory,
      });
      botStateRef.current = result.state;
      setResolvedPickup(result.state.resolvedPickup ?? null);
      setResolvedDropoff(result.state.resolvedDropoff ?? null);
      addBotMessage(result.botMessage, result.highlights || []);
    } catch (err) {
      console.error('BoogieBot API error:', err);
      addBotMessage("Something went wrong. Try again—tell me where you'd like to be picked up or dropped off.");
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  // For Expo Go, we'll use the device's built-in voice input via keyboard
  // On iOS/Android, users can tap the microphone icon on the keyboard
  const startRecording = async () => {
    setIsRecording(true);
    // Focus the text input and show instructions
    // On iOS/Android, the keyboard will have a microphone button for voice input
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
    
    // Show helpful instructions
    setTimeout(() => {
      Alert.alert(
        'Voice Input',
        'Tap the microphone icon on your keyboard to use voice input, or type your message directly.',
        [{ text: 'Got it' }]
      );
    }, 300);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    if (isProcessing) return; // prevent double-send; button stays tappable
    const message = manualInput.trim();
    addUserMessage(message);
    processVoiceInput(message);
    setManualInput('');
  };

  // Manual speech function - only called when user taps "Read Messages" button
  const readAllMessages = async () => {
    try {
      if (transcript.length === 0) {
        AccessibilityInfo.announceForAccessibility?.('No messages to read yet.');
        return;
      }

      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      if (isScreenReaderEnabled) {
        // Screen reader is active - announce each message sequentially
        // Focus on first message, then announce all
        if (transcript.length > 0) {
          const firstMessageNode = findNodeHandle(messageRefs.current[transcript[0].timestamp]);
          if (firstMessageNode) {
            AccessibilityInfo.setAccessibilityFocus(firstMessageNode);
          }
        }
        
        // Announce all messages with pauses between them
        transcript.forEach((msg, index) => {
          setTimeout(() => {
            const cleanText = (msg.text || '').replace(/\*\*/g, '');
            const speaker = msg.type === 'user' ? 'You said' : 'BoogieBot said';
            const announcement = `${speaker}: ${cleanText}`;
            AccessibilityInfo.announceForAccessibility?.(announcement);
          }, index * 2000); // 2 second delay between each message
        });
      } else {
        // No screen reader - use TTS to read all messages
        const allText = transcript.map(msg => {
          const cleanText = (msg.text || '').replace(/\*\*/g, '');
          const speaker = msg.type === 'user' ? 'You said' : 'BoogieBot said';
          return `${speaker}: ${cleanText}`;
        }).join('. ');
        
        Speech.speak(allText, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
        });
      }
    } catch (error) {
      console.error('Error reading messages:', error);
      // Fallback: try to announce error
      AccessibilityInfo.announceForAccessibility?.('Error reading messages. Please try again.');
    }
  };

  const readLastMessage = async () => {
    if (transcript.length === 0) return;
    
    try {
      const lastMessage = transcript[transcript.length - 1];
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      const lastSpeaker = lastMessage.type === 'user' ? 'You said' : 'BoogieBot said';
      const lastText = lastMessage.text || '';
      if (isScreenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility(`${lastSpeaker}: ${lastText}`);
      } else {
        Speech.speak(`${lastSpeaker}: ${lastText}`, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
        });
      }
    } catch (error) {
      console.error('Error reading last message:', error);
    }
  };

  const handleContinueToConfirmation = () => {
    const pickupLocationText = resolvedPickup?.displayText ?? DEFAULT_PICKUP_LOCATION.displayText;
    const dropoffLocationText = resolvedDropoff?.displayText ?? 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305';
    const dropoffLocationName = resolvedDropoff?.displayName ?? 'CoDa';

    navigation.navigate('RideRegistration', {
      pickupLocation: pickupLocationText,
      dropoffLocation: dropoffLocationText,
      dropoffLocationName,
    });
  };

  const renderMessage = (message, index) => {
    const type = message.type === 'user' ? 'user' : 'bot';
    const isUser = type === 'user';
    const highlights = message.highlights || [];
    
    let displayText = message.text;
    highlights.forEach((highlight) => {
      displayText = displayText.replace(
        new RegExp(`\\*\\*${highlight}\\*\\*`, 'gi'),
        `**${highlight}**`
      );
    });

    // Clean text for accessibility (remove markdown formatting)
    const cleanText = (message.text || '').replace(/\*\*/g, '');

    return (
      <View
        key={`msg-${index}-${type}-${message.timestamp}`}
        ref={(ref) => {
          if (ref) messageRefs.current[message.timestamp] = ref;
        }}
        style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={isUser ? `You said: ${cleanText}` : `BoogieBot said: ${cleanText}`}
        importantForAccessibility="yes"
      >
        <Text 
          style={styles.messageLabel}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        >
          {isUser ? 'You:' : 'BoogieBot:'}
        </Text>
        <Text 
          style={styles.messageText} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        >
          {displayText.split('**').map((part, index) => {
            if (index % 2 === 1) {
              return (
                <Text key={index} style={styles.highlightedText}>
                  {part}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text 
          ref={logoRef}
          style={styles.logo} 
          accessibilityRole="text"
          accessible={true}
          importantForAccessibility="yes"
          accessibilityLabel="Boogie app"
        >
          boogie
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.promptContainer}>
        <Text style={styles.prompt} accessibilityRole="header">
          Book a DisGo ride: pickup and dropoff
        </Text>
        <Text style={styles.promptSubtext}>
          BoogieBot will ask where you want to be picked up, then where you want to be dropped off. Use building names and landmarks (e.g. north entrance, near the Oval).
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.transcriptContainer}
        contentContainerStyle={styles.transcriptContent}
        accessible={false}
        importantForAccessibility="no"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {transcript.length === 0 ? (
          <View style={styles.emptyState}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice recording'}
              accessibilityHint="Double tap to start or stop voice input"
            >
              {isRecording ? (
                <ActivityIndicator size="large" color={colors.secondary} />
              ) : (
                <Text style={styles.recordButtonIcon}>🎤</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.emptyStateText}>
              Tap the microphone button, then use your keyboard's voice input (🎤 icon) or type your message
            </Text>
            <View style={styles.manualInputContainer}>
              <Text style={styles.manualInputLabel}>
                Tap the microphone button above, then use your keyboard's voice input (🎤 icon) or type:
              </Text>
              <TextInput
                ref={textInputRef}
                style={styles.manualInput}
                value={manualInput}
                onChangeText={setManualInput}
                placeholder="Say or type: 'I want to go to coda'..."
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleManualSubmit}
                onBlur={() => Keyboard.dismiss()}
                accessibilityLabel="Type or use voice input for your destination message"
                accessibilityRole="textbox"
                accessibilityHint="You can use your device's voice input by tapping the microphone icon on your keyboard"
                returnKeyType="send"
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleManualSubmit}
                accessibilityRole="button"
                accessibilityLabel="Submit message"
              >
                <Text style={styles.submitButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View 
              ref={conversationHeaderRef}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel={`Conversation with ${transcript.length} message${transcript.length !== 1 ? 's' : ''}`}
              style={styles.conversationHeader}
              importantForAccessibility="yes"
            >
              <Text 
                style={styles.conversationHeaderText}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              >
                Conversation ({transcript.length} message{transcript.length !== 1 ? 's' : ''})
              </Text>
            </View>
            {transcript.map((message, index) => renderMessage(message, index))}
            <View style={styles.manualInputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.manualInput}
                value={manualInput}
                onChangeText={setManualInput}
                placeholder="Continue conversation... (use keyboard 🎤 for voice)"
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleManualSubmit}
                onBlur={() => Keyboard.dismiss()}
                editable={true}
                accessibilityLabel="Continue conversation using voice or text"
                accessibilityRole="textbox"
                accessibilityHint="Use your keyboard's microphone icon for voice input"
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
                onPress={handleManualSubmit}
                accessibilityRole="button"
                accessibilityLabel={isProcessing ? 'BoogieBot is thinking' : 'Send message'}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Text style={styles.submitButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
            {isProcessing && (
              <View style={styles.recordingIndicator}>
                <Text style={styles.recordingText}>BoogieBot is thinking...</Text>
              </View>
            )}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.recordingText}>Listening...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {transcript.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.readButton}
            onPress={readAllMessages}
            accessibilityRole="button"
            accessibilityLabel={`Read all ${transcript.length} messages aloud`}
            accessibilityHint="Announces all conversation messages. For screen reader users, this will announce each message sequentially."
            accessible={true}
            importantForAccessibility="yes"
          >
            <Text 
              style={styles.readButtonText}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            >
              🔊 Read Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinueToConfirmation}
            accessibilityRole="button"
            accessibilityLabel="Continue to ride confirmation"
          >
            <Text style={styles.primaryButtonText}>
              Continue to ride confirmation
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 32,
    color: colors.text,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  promptContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  prompt: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  promptSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  transcriptContainer: {
    flex: 1,
  },
  transcriptContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonActive: {
    backgroundColor: colors.error,
  },
  recordButtonIcon: {
    fontSize: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  conversationHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  conversationHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    minHeight: 44, // Ensure minimum touch target size
  },
  userMessage: {
    backgroundColor: colors.backgroundLight,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  botMessage: {
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  highlightedText: {
    fontWeight: '600',
    color: colors.primary,
  },
  recordButtonSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  recordButtonSmallIcon: {
    fontSize: 24,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  recordingText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  manualInputContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  manualInputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  readButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  readButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.text,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceInputScreen;
