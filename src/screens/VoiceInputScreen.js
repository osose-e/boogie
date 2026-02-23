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
import { colors } from '../styles/colors';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

const VoiceInputScreen = ({ navigation, route }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [recognizedLocation, setRecognizedLocation] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);

  // Simulated voice input for Expo Go compatibility
  // In a production app, you would integrate with a speech recognition API

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
    const lowerInput = input.toLowerCase();

    // Simulate AI processing - in a real app, this would call an API
    if (lowerInput.includes("coda") || lowerInput.includes("computing")) {
      const location =
        "Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305";
      setRecognizedLocation(location);
      const botMessage1 =
        "Okay, got it. You want to be dropped off at **CoDa, the Computing and Data Science building on the Stanford campus**.";
      addBotMessage(botMessage1, [
        "CoDa",
        "Computing and Data Science building",
        "Stanford campus",
      ]);
      speakResponse(botMessage1);

      setTimeout(() => {
        const botMessage2 =
          "Is there a particular entrance that you would like to be dropped off at?";
        addBotMessage(botMessage2);
        speakResponse(botMessage2);
      }, 1500);
    } else if (
      lowerInput.includes("stairs") ||
      lowerInput.includes("fountain") ||
      lowerInput.includes("gilbert") ||
      lowerInput.includes("gates") ||
      lowerInput.includes("basement")
    ) {
      const botMessage =
        "Got it. You would like to be dropped at the **southwest entrance of CODA**. Any other specifications?";
      addBotMessage(botMessage, ["southwest entrance of CODA"]);
      speakResponse(botMessage);
    } else if (
      lowerInput.includes("blend") ||
      lowerInput.includes("chemistry") ||
      lowerInput.includes("north") ||
      lowerInput.includes("sapp") ||
      lowerInput.includes("stlc")
    ) {
      const botMessage =
        "Got it. You would like to be dropped at the **north entrance of CoDa**. Any other specifications?";
      addBotMessage(botMessage, ["north entrance of CoDa"]);
      speakResponse(botMessage);
    } else if (
      lowerInput.includes("oval") ||
      lowerInput.includes("bikes") ||
      lowerInput.includes("main") ||
      lowerInput.includes("voyager") ||
      lowerInput.includes("coffee") ||
      lowerInput.includes("east")
    ) {
      const botMessage =
        "Got it. You would like to be dropped at the **east entrance of CoDa**. Any other specifications?";
      addBotMessage(botMessage, ["north entrance of CODA"]);
      speakResponse(botMessage);
    } else if (
      lowerInput.includes("that's it") ||
      lowerInput.includes("no") ||
      lowerInput.includes("done")
    ) {
      const botMessage1 =
        "Great! Converting your location into a pinpoint for your driver.";
      addBotMessage(botMessage1);
      speakResponse(botMessage1);
      setTimeout(() => {
        const botMessage2 =
          "Secured your dropoff location. Please proceed to complete your ride booking with Boogie!";
        addBotMessage(botMessage2);
        speakResponse(botMessage2);
      }, 1500);
    } else {
      const botMessage =
        "I understand. Could you provide more details about your dropoff location?";
      addBotMessage(botMessage);
      speakResponse(botMessage);
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

  // Simulated voice responses - speak the bot's response
  const speakResponse = (text) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const handleContinueToConfirmation = () => {
    const dropoffLocation = recognizedLocation || 
      'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305';
    
    navigation.navigate('RideRegistration', {
      pickupLocation: DEFAULT_PICKUP_LOCATION.fullAddress,
      dropoffLocation: dropoffLocation,
      dropoffLocationName: 'CoDa',
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
        style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={isUser ? `You said: ${message.text}` : `BoogieBot: ${message.text}`}
      >
        <Text style={styles.messageLabel}>
          {isUser ? 'User Name:' : 'BoogieBot:'}
        </Text>
        <Text style={styles.messageText}>
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
        <Text style={styles.logo} accessibilityRole="text">
          boogie
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.promptContainer}>
        <Text style={styles.prompt} accessibilityRole="header">
          Where would you like to be dropped off?
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
            {transcript.map(renderMessage)}
            <View style={styles.manualInputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.manualInput}
                value={manualInput}
                onChangeText={setManualInput}
                placeholder="Continue conversation... (use keyboard 🎤 for voice)"
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleManualSubmit}
                accessibilityLabel="Continue conversation using voice or text"
                accessibilityRole="textbox"
                accessibilityHint="Use your keyboard's microphone icon for voice input"
                returnKeyType="send"
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleManualSubmit}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Text style={styles.submitButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
            {(isRecording || isLoadingBot) && (
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
            style={styles.secondaryButton}
            onPress={() => startRecording()}
            accessibilityRole="button"
            accessibilityLabel="Continue conversing with BoogieBot"
          >
            <Text style={styles.secondaryButtonText}>
              Continue conversing with BoogieBot
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
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
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
