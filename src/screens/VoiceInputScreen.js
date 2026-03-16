import React, { useState, useRef, useEffect, useCallback, useActionState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
import BoogieBotHeader from '../components/BoogieBotHeader';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { getOpenAIApiKey } from '../config';
import { getInitialBotMessage, getInitialTripRequest, tripRequestFromStructuredContext, isTripRequestFilled, processBoogieBotTurn } from '../services/boogieBotApi';
import { resolveTripSlotToLocation } from '../services/campusDataLoader';

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
  const [tripRequest, setTripRequest] = useState(getInitialTripRequest());
  const botStateRef = useRef({
    tripRequest: getInitialTripRequest(),
    phase: 'pickup',
    resolvedPickup: null,
    resolvedDropoff: null,
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const { theme, themeMode } = useTheme();

  // for previous context (e.g. user came from Search → EntranceSelect → "Get help from BoogieBot")
  const seededOnceRef = useRef(false);
  const structuredContextAppliedRef = useRef(false);
  const { seedMessage, structuredContext } = route?.params ?? {};

  // Pre-fill trip request from search/entrance flow as soon as we have structuredContext (with or without seedMessage)
  useEffect(() => {
    if (!structuredContext || structuredContextAppliedRef.current) return;
    structuredContextAppliedRef.current = true;
    const defaultPickupLocation = {
      displayText: DEFAULT_PICKUP_LOCATION.displayText,
      displayName: DEFAULT_PICKUP_LOCATION.displayName,
      coordinates: DEFAULT_PICKUP_LOCATION.coordinates,
    };
    const nextTripRequest = tripRequestFromStructuredContext(structuredContext);
    botStateRef.current.tripRequest = nextTripRequest;
    setTripRequest(nextTripRequest);
    console.log('[BoogieBot] trip request updated (from search/entrance context):', JSON.stringify(nextTripRequest, null, 2));
    botStateRef.current.phase = structuredContext.mode === 'dropoff' ? 'dropoff' : 'pickup';
    const resolvedPickup = resolveTripSlotToLocation(nextTripRequest.pickup, {
      currentLocation: currentLocation ?? undefined,
      defaultPickupLocation,
    });
    const resolvedDropoff = resolveTripSlotToLocation(nextTripRequest.dropoff, {});
    botStateRef.current.resolvedPickup = resolvedPickup;
    botStateRef.current.resolvedDropoff = resolvedDropoff;
    setResolvedPickup(resolvedPickup ?? null);
    setResolvedDropoff(resolvedDropoff ?? null);
  }, [structuredContext, currentLocation]);

  useEffect(() => {
    // Auto-seed only once per mount, only if we were navigated here with a seedMessage
    if (seededOnceRef.current) return;
    if (!seedMessage) return;

    // Wait until we've put the initial bot message in the transcript
    if (!initializedRef.current || transcript.length === 0) return;

    seededOnceRef.current = true;

    // Add the seeded user message visibly
    addUserMessage(seedMessage);

    // A11y: announce that we auto-sent context
    AccessibilityInfo.announceForAccessibility?.(
      `Sent to BoogieBot: ${seedMessage}`
    );

    // Actually send it (AI will see the pre-filled tripRequest in state)
    processVoiceInput(seedMessage);
  }, [seedMessage, transcript.length]);

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

  // Focus screen reader on Boogie header when screen is focused (e.g. after navigating to this page)
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        const node = findNodeHandle(logoRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 400);
      return () => clearTimeout(t);
    }, [])
  );

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

  // Dismiss keyboard when it hides (e.g. user switched apps or tapped outside)
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => Keyboard.dismiss());
    return () => sub.remove();
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
      if (result.state.tripRequest != null) {
        setTripRequest(result.state.tripRequest);
        console.log('[BoogieBot] trip request updated (from conversation):', JSON.stringify(result.state.tripRequest, null, 2));
      }
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
    const isLastMessage = index === transcript.length - 1;

    let displayText = message.text;
    highlights.forEach((highlight) => {
      displayText = displayText.replace(
        new RegExp(`\\*\\*${highlight}\\*\\*`, 'gi'),
        `**${highlight}**`
      );
    });

    // Clean text for VoiceOver/screen readers (no markdown)
    const cleanText = (message.text || '').replace(/\*\*/g, '').trim() || 'No content';
    const roleLabel = isUser ? 'You' : 'BoogieBot';
    const positionLabel = transcript.length > 1 ? `Message ${index + 1} of ${transcript.length}. ` : '';

    return (
      <View
        key={`msg-${index}-${type}-${message.timestamp}`}
        ref={(ref) => {
          if (ref) messageRefs.current[message.timestamp] = ref;
        }}
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessage
            : [styles.botMessage, { borderColor: theme.colors.border }],
        ]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`${positionLabel}${roleLabel}: ${cleanText}`}
        accessibilityHint={isUser ? "Your message." : "BoogieBot message."}
        importantForAccessibility="yes"
        accessibilityLiveRegion={isLastMessage ? "polite" : undefined}
      >
        <Text
          style={[
            styles.messageLabel,
            { color: isUser ? theme.colors.background : theme.colors.header3 },
          ]}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        >
          {isUser ? "You:" : "BoogieBot:"}
        </Text>
        <Text
          style={[
            styles.messageText,
            { color: isUser ? theme.colors.background : theme.colors.body },
          ]}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        >
          {displayText.split("**").map((part, idx) => {
            if (idx % 2 === 1) {
              return (
                <Text
                  key={idx}
                  style={[styles.highlightedText, { color: "#09A6B8" }]}
                >
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={themeMode === "light" ? "dark" : "light"} />
      <BoogieBotHeader ref={logoRef} />
      <View
        style={[
          styles.promptContainer,
          { borderBottomColor: theme.colors.border },
        ]}
        accessible={true}
        accessibilityRole="header"
        importantForAccessibility="yes"
      >
        <Text
          style={[styles.prompt, { color: theme.colors.header3 }]}
          accessibilityElementsHidden={true}
        >
          Book a DisGo ride: Pickup and Dropoff
        </Text>
        <Text
          style={[styles.promptSubtext, { color: theme.colors.body }]}
          accessibilityElementsHidden={true}
        >
          BoogieBot will ask where you want to be picked up, then where you want
          to be dropped off. Please building names, directions and landmarks
          (e.g. north entrance, near the Oval).
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.chatWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.transcriptContainer}
          scrollIndicatorInsets={{ right: -3 }}
          contentContainerStyle={styles.transcriptContent}
          keyboardShouldPersistTaps="always"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          accessible={false}
          importantForAccessibility="no"
        >
          <View
            ref={conversationHeaderRef}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel={`Conversation with BoogieBot, ${transcript.length} message${transcript.length !== 1 ? "s" : ""}. Swipe right to read each message.`}
            style={[
              styles.conversationHeader,
              { borderBottomColor: theme.colors.border },
            ]}
            importantForAccessibility="yes"
          >
            <Text
              style={[
                styles.conversationHeaderText,
                { color: theme.colors.header3 },
              ]}
              accessibilityElementsHidden={true}
            >
              Conversation ({transcript.length} message
              {transcript.length !== 1 ? "s" : ""})
            </Text>
          </View>
          <View
            accessible={false}
            importantForAccessibility="no"
            style={styles.messageListWrapper}
          >
            {transcript.map((message, index) => renderMessage(message, index))}
          </View>
        </ScrollView>

        <View
          style={[styles.inputSection, { borderTopColor: theme.colors.border }]}
          pointerEvents="box-none"
          accessible={false}
          importantForAccessibility="no"
          collapsable={false}
        >
          <View
            style={styles.inputRow}
            pointerEvents="box-none"
            collapsable={false}
          >
            <TextInput
              ref={textInputRef}
              style={[
                styles.manualInput,
                { borderColor: theme.colors.border, color: theme.colors.body },
              ]}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder={
                transcript.length === 0
                  ? "e.g. I want to go to CoDa"
                  : "Type or say your next message..."
              }
              placeholderTextColor={theme.colors.bodyPlaceholder}
              onSubmitEditing={handleManualSubmit}
              onBlur={() => Keyboard.dismiss()}
              editable={true}
              accessibilityLabel={
                transcript.length === 0
                  ? "Message to BoogieBot. Type or use keyboard voice input."
                  : "Your reply. Type or use keyboard voice input."
              }
              accessibilityRole="textbox"
              accessibilityHint="Double tap to edit. Use keyboard microphone for voice."
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                isProcessing && styles.submitButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              accessibilityRole="button"
              accessibilityLabel={
                isProcessing ? "BoogieBot is thinking" : "Send message"
              }
              accessibilityState={{ disabled: isProcessing }}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.colors.body} />
              ) : (
                <Ionicons
                  name="send"
                  size={30}
                  color={
                    !manualInput.trim() || isProcessing ? "#808080" : "#09A6B8"
                  }
                />
              )}
            </TouchableOpacity>
          </View>
          {isProcessing && (
            <View
              style={styles.statusBar}
              accessible={true}
              accessibilityLiveRegion="polite"
              accessibilityLabel="BoogieBot is thinking"
            >
              <Text
                style={[styles.statusText, { color: theme.colors.header3 }]}
              >
                BoogieBot is thinking…
              </Text>
            </View>
          )}
          {isRecording && (
            <View
              style={styles.statusBar}
              accessible={true}
              accessibilityLiveRegion="polite"
              accessibilityLabel="Listening"
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Listening…</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {transcript.length > 0 && (
        <View
          style={[
            styles.actionButtonsOuter,
            { borderTopColor: theme.colors.border },
          ]}
          accessible={false}
          importantForAccessibility="no"
          collapsable={false}
        >
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !isTripRequestFilled(tripRequest) && styles.primaryButtonDisabled,
            ]}
            onPress={handleContinueToConfirmation}
            disabled={!isTripRequestFilled(tripRequest)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Continue to ride confirmation"
            accessibilityHint={
              isTripRequestFilled(tripRequest)
                ? "Double tap to go to the next step and complete your ride booking."
                : "Finish setting your pickup and dropoff locations (including entrances) to continue."
            }
            accessibilityState={{
              disabled: !isTripRequestFilled(tripRequest),
            }}
            importantForAccessibility="yes"
          >
            <Text
              style={[styles.primaryButtonText, {color: theme.colors.background}]}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            >
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
  },
  content: { flex: 1, paddingHorizontal: theme.spacing.lg },
  promptContainer: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 2,
  },
  prompt: {
    fontSize: 20,
    fontFamily: theme.fonts.header3,
  },
  promptSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    marginTop: 8,
    lineHeight: 20,
  },
  chatWrapper: {
    flex: 1,
  },
  transcriptContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  transcriptContent: {
    marginTop: 20,
    paddingBottom: 16,
  },
  emptyState: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 280,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
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
    borderBottomWidth: 1,
  },
  messageListWrapper: {},
  conversationHeaderText: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 15,
    minHeight: 44, // Ensure minimum touch target size
  },
  userMessage: {
    backgroundColor: theme.colors.light.primary,
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  botMessage: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    borderWidth: 1,
  },
  messageLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.header3,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    lineHeight: 24,
  },
  highlightedText: {
    fontFamily: theme.fonts.header3,
  },
  recordButtonSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 16,
  },
  recordButtonSmallIcon: {
    fontSize: 24,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    minHeight: 48,
  },
  sendButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    // minWidth: 72,
    // minHeight: 48,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: theme.fonts.header3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
  },
  actionButtonsOuter: {
    padding: 20,
    borderTopWidth: 2,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: "center",
    backgroundColor: theme.colors.light.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
  },
});

export default VoiceInputScreen;
