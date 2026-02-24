import React, { useState, useRef } from 'react';
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
} from 'react-native';
import * as Speech from 'expo-speech';
import { useTheme } from '../contexts/ThemeContext';
import { lightColors } from '../styles/colors';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { getBoogieBotResponse } from '../services/boogieBotApi';

const VoiceInputScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [recognizedLocation, setRecognizedLocation] = useState(null);
  const [recognizedLocationName, setRecognizedLocationName] = useState(null);
  const [recognizedEntranceDescriptor, setRecognizedEntranceDescriptor] = useState(null);
  const [recognizedPickupLocation, setRecognizedPickupLocation] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [isLoadingBot, setIsLoadingBot] = useState(false);
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);

  const addUserMessage = (text) => {
    setTranscript((prev) => [
      ...prev,
      { type: 'user', text, timestamp: Date.now() },
    ]);
  };

  const addBotMessage = (text, highlights = []) => {
    setTranscript((prev) => [
      ...prev,
      { type: 'bot', text, highlights, timestamp: Date.now() },
    ]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const processVoiceInput = async (input) => {
    const trimmed = (input || '').trim();
    if (!trimmed) return;

    addUserMessage(trimmed);
    setIsLoadingBot(true);

    try {
      const conversationHistory = transcript.map((m) => ({
        type: m.type,
        text: m.text,
      }));
      const { botMessage, location, pickup, conversationComplete } = await getBoogieBotResponse(
        trimmed,
        conversationHistory
      );

      if (location && location.address) {
        setRecognizedLocation(location.address);
        if (location.name) setRecognizedLocationName(location.name);
        if (location.entranceDescriptor) setRecognizedEntranceDescriptor(location.entranceDescriptor);
      }
      if (pickup && pickup.address) {
        setRecognizedPickupLocation(pickup.address);
      }

      const message = botMessage || "Got it. Anything else about your drop-off?";
      const highlights = (message.match(/\*\*([^*]+)\*\*/g) || []).map((s) => s.replace(/\*\*/g, ''));
      addBotMessage(message, highlights);
      speakResponse(message);
    } catch (err) {
      console.warn('Boogie bot error:', err);
      addBotMessage("Something went wrong. Please try again or describe your drop-off in another way.");
    } finally {
      setIsLoadingBot(false);
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
    if (manualInput.trim()) {
      addUserMessage(manualInput);
      processVoiceInput(manualInput);
      setManualInput('');
    }
  };

  const speakResponse = (text) => {
    const plain = (text || '').replace(/\*\*([^*]+)\*\*/g, '$1').trim();
    if (!plain) return;
    try {
      Speech.speak(plain, { language: 'en-US', pitch: 1.0, rate: 0.9 });
    } catch (e) {
      console.warn('Speech.speak error:', e?.message);
    }
  };

  const handleContinueToConfirmation = () => {
    const pickupAddr = recognizedPickupLocation || DEFAULT_PICKUP_LOCATION.fullAddress || DEFAULT_PICKUP_LOCATION.address;
    const dropoffLocation = recognizedLocation || 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305';
    navigation.navigate('RideRegistration', {
      pickupLocation: pickupAddr,
      dropoffLocation,
      dropoffLocationName: recognizedLocationName || undefined,
      dropoffEntranceDescriptor: recognizedEntranceDescriptor || undefined,
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const highlights = message.highlights || [];
    
    let displayText = message.text;
    highlights.forEach((highlight) => {
      displayText = displayText.replace(
        new RegExp(`\\*\\*${highlight}\\*\\*`, 'gi'),
        `**${highlight}**`
      );
    });

    return (
      <View
        key={message.timestamp}
        style={[
          styles.messageContainer,
          isUser
            ? [styles.userMessage, { backgroundColor: colors.backgroundLight }]
            : [styles.botMessage, { backgroundColor: colors.background, borderColor: colors.border }],
        ]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={isUser ? `You said: ${message.text}` : `Dispatcher: ${message.text}`}
      >
        <Text style={[styles.messageLabel, { color: colors.textSecondary }]}>
          {isUser ? 'You' : 'Dispatcher'}
        </Text>
        <Text style={[styles.messageText, { color: colors.text }]}>
          {displayText.split('**').map((part, index) => {
            if (index % 2 === 1) {
              return (
                <Text key={index} style={[styles.highlightedText, { color: colors.primary }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.logo, { color: colors.text }]} accessibilityRole="text">
          boogie
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.promptContainer}>
        <Text style={[styles.prompt, { color: colors.text }]} accessibilityRole="header">
          Tell the dispatcher where you'd like to be dropped off
        </Text>
        <Text style={[styles.promptSub, { color: colors.textSecondary }]} accessibilityRole="text">
          Use landmarks like "north entrance", "by the bike racks", or "near the Blend".
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.transcriptContainer}
        contentContainerStyle={styles.transcriptContent}
        accessible={true}
        accessibilityLabel="Conversation transcript with BoogieBot"
      >
        {transcript.length === 0 ? (
          <View style={styles.emptyState}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                { backgroundColor: colors.primary },
                isRecording && [styles.recordButtonActive, { backgroundColor: colors.error }],
              ]}
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
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Type below or use your keyboard's voice input (🎤) to chat with the dispatcher.
            </Text>
            <View style={[styles.manualInputContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.manualInputLabel, { color: colors.textSecondary }]}>
                Say or type your destination (e.g. "CoDa, north entrance by the Blend"):
              </Text>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.manualInput,
                  {
                    backgroundColor: colors.backgroundLight,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={manualInput}
                onChangeText={setManualInput}
                placeholder="e.g. CoDa, north entrance by the Blend"
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleManualSubmit}
                accessibilityLabel="Type or use voice input for your destination message"
                accessibilityRole="textbox"
                accessibilityHint="You can use your device's voice input by tapping the microphone icon on your keyboard"
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleManualSubmit}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Text style={[styles.submitButtonText, { color: colors.secondary }]}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {transcript.map(renderMessage)}
            <View style={styles.manualInputContainer}>
              <TextInput
                ref={textInputRef}
                style={[
                  styles.manualInput,
                  {
                    backgroundColor: colors.backgroundLight,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={manualInput}
                onChangeText={setManualInput}
                placeholder="Continue conversation… (use keyboard 🎤 for voice)"
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleManualSubmit}
                accessibilityLabel="Continue conversation using voice or text"
                accessibilityRole="textbox"
                accessibilityHint="Use your keyboard's microphone icon for voice input"
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleManualSubmit}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Text style={[styles.submitButtonText, { color: colors.secondary }]}>Send</Text>
              </TouchableOpacity>
            </View>
            {(isRecording || isLoadingBot) && (
              <View style={styles.recordingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.recordingText, { color: colors.primary }]}>
                  {isLoadingBot ? 'Dispatcher is thinking…' : 'Listening…'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {transcript.length > 0 && (
        <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.backgroundLight, borderColor: colors.border }]}
            onPress={() => startRecording()}
            accessibilityRole="button"
            accessibilityLabel="Continue chatting with dispatcher"
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Keep chatting
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleContinueToConfirmation}
            accessibilityRole="button"
            accessibilityLabel="Continue to ride details"
          >
            <Text style={[styles.primaryButtonText, { color: colors.secondary }]}>
              Continue to ride details
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const fallbackColors = lightColors;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: fallbackColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: fallbackColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: { fontSize: 32, color: fallbackColors.text },
  logo: { fontSize: 24, fontWeight: '600', color: fallbackColors.text },
  headerSpacer: { width: 40 },
  promptContainer: { paddingHorizontal: 20, paddingVertical: 20 },
  prompt: { fontSize: 20, fontWeight: '600' },
  promptSub: { fontSize: 14, marginTop: 6 },
  transcriptContainer: { flex: 1 },
  transcriptContent: { padding: 20 },
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
    backgroundColor: fallbackColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonActive: { backgroundColor: fallbackColors.error },
  recordButtonIcon: { fontSize: 40 },
  emptyStateText: { fontSize: 16, color: fallbackColors.textSecondary },
  messageContainer: { marginBottom: 16, padding: 12, borderRadius: 8 },
  userMessage: {
    backgroundColor: fallbackColors.backgroundLight,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  botMessage: {
    backgroundColor: fallbackColors.background,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: fallbackColors.border,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: fallbackColors.textSecondary,
    marginBottom: 4,
  },
  messageText: { fontSize: 16, color: fallbackColors.text, lineHeight: 24 },
  highlightedText: { fontWeight: '600', color: fallbackColors.primary },
  recordButtonSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: fallbackColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  recordButtonSmallIcon: { fontSize: 24 },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  recordingText: { fontSize: 14, color: fallbackColors.primary, fontWeight: '600' },
  manualInputContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: fallbackColors.border,
  },
  manualInputLabel: { fontSize: 14, color: fallbackColors.textSecondary, marginBottom: 8 },
  manualInput: {
    backgroundColor: fallbackColors.backgroundLight,
    borderWidth: 1,
    borderColor: fallbackColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: fallbackColors.text,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: fallbackColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: fallbackColors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: fallbackColors.border,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: fallbackColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: fallbackColors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: fallbackColors.backgroundLight,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: fallbackColors.border,
  },
  secondaryButtonText: {
    color: fallbackColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceInputScreen;
