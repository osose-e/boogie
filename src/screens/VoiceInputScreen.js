import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import BoogieBotHeader from '../components/BoogieBotHeader';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { LinearGradient } from "expo-linear-gradient";

const VoiceInputScreen = ({ navigation, route }) => {
  const { theme } = useTheme();



  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [recognizedLocation, setRecognizedLocation] = useState(null);
  const [userDescriptor, setUserDescriptor] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [pickupLocation] = useState(DEFAULT_PICKUP_LOCATION.displayText);
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const messageRefs = useRef({});
  const conversationHeaderRef = useRef(null);
  const logoRef = useRef(null);
  const initializedRef = useRef(false);

  // Initialize conversation with pickup location
  useEffect(() => {
    if (!initializedRef.current && transcript.length === 0) {
      initializedRef.current = true;
      const initialBotMessage = `Hello! I'm BoogieBot. I see your current pickup location is ${pickupLocation}. Where would you like to be dropped off?`;
      // Use a unique timestamp with a small random offset to ensure uniqueness
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
    const lowerInput = input.toLowerCase();

    // Extract user's descriptor words (common location descriptors)
    const descriptorKeywords = [
      'blend', 'chemistry', 'stairs', 'fountain', 'gilbert', 'gates', 
      'basement', 'north', 'south', 'east', 'west', 'sapp', 'stlc',
      'oval', 'bikes', 'main', 'voyager', 'coffee', 'near', 'close to',
      'by', 'next to', 'beside'
    ];
    
    // Try to extract descriptor phrase - look for patterns like "near X", "close to X", "by X"
    let descriptorPhrase = null;
    
    // Pattern 1: "near [word]" or "close to [word]" or "by [word]" (case insensitive, handles "Near blend")
    // Improved regex that captures the full phrase including preposition
    // Changed [a-z] to [a-zA-Z] to handle capitalized words like "Blend"
    const nearPattern = /(?:near|close to|by|next to|beside)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i;
    const nearMatch = input.match(nearPattern);
    if (nearMatch && nearMatch[0]) {
      descriptorPhrase = nearMatch[0].trim(); // Get the full phrase like "near blend" or "Near blend"
      setUserDescriptor(descriptorPhrase);
    } else {
      // Pattern 2: Check if any descriptor keyword is mentioned (like just "blend" or "gilbert")
      const foundKeyword = descriptorKeywords.find(keyword => 
        lowerInput.includes(keyword)
      );
      
      if (foundKeyword) {
        const words = input.split(/\s+/);
        const keywordIndex = words.findIndex(w => 
          w.toLowerCase().includes(foundKeyword)
        );
        if (keywordIndex !== -1) {
          // Check if there's a preposition before the keyword
          if (keywordIndex > 0) {
            const prevWord = words[keywordIndex - 1].toLowerCase();
            if (['near', 'by', 'close', 'next', 'beside'].includes(prevWord)) {
              // Get the preposition + keyword (preserve original case)
              descriptorPhrase = words.slice(keywordIndex - 1, keywordIndex + 1).join(' ');
            } else if (prevWord === 'to' && keywordIndex > 1) {
              // Handle "close to" or "next to"
              const prevPrevWord = words[keywordIndex - 2].toLowerCase();
              if (['close', 'next'].includes(prevPrevWord)) {
                descriptorPhrase = words.slice(keywordIndex - 2, keywordIndex + 1).join(' ');
              } else {
                // Just the keyword, add "near"
                descriptorPhrase = `near ${words[keywordIndex]}`;
              }
            } else {
              // Just the keyword, add "near"
              descriptorPhrase = `near ${words[keywordIndex]}`;
            }
          } else {
            // Keyword is first word, add "near"
            descriptorPhrase = `near ${words[keywordIndex]}`;
          }
          setUserDescriptor(descriptorPhrase);
        }
      }
    }
    
    // Use existing descriptor if no new one found (persist across messages)
    // IMPORTANT: Use descriptorPhrase first (from current input) before userDescriptor (from state)
    // because state updates are async and might not be available immediately
    const currentDescriptor = descriptorPhrase || userDescriptor;

    // Simulate AI processing - in a real app, this would call an API
    if (lowerInput.includes("coda") || lowerInput.includes("computing")) {
      const location =
        "Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305";
      setRecognizedLocation(location);
      
      let botMessage1;
      if (currentDescriptor) {
        botMessage1 =
          `Okay, got it. You want to be dropped off at **CoDa, the Computing and Data Science building on the Stanford campus**. You mentioned "${currentDescriptor.toLowerCase()}". Is there a particular entrance that you would like to be dropped off at?`;
      } else {
        botMessage1 =
          "Okay, got it. You want to be dropped off at **CoDa, the Computing and Data Science building on the Stanford campus**.";
      }
      
      addBotMessage(botMessage1, [
        "CoDa",
        "Computing and Data Science building",
        "Stanford campus",
      ]);

      if (!currentDescriptor) {
        setTimeout(() => {
          const botMessage2 =
            "Is there a particular entrance that you would like to be dropped off at?";
          addBotMessage(botMessage2);
        }, 1500);
      }
    } else if (
      lowerInput.includes("blend") ||
      lowerInput.includes("chemistry") ||
      (lowerInput.includes("north") && !lowerInput.includes("south"))
    ) {
      // Use the descriptor from current input first (descriptorPhrase), then fallback to state
      // This ensures we use what the user just typed, not stale state
      let descriptor = descriptorPhrase || userDescriptor;
      
      // If still no descriptor, try to extract from current input directly
      if (!descriptor && lowerInput.includes("blend")) {
        // Try to find "near blend" or "Near blend" in the input (case insensitive)
        const blendMatch = input.match(/(?:near|close to|by|next to|beside)\s+blend/i);
        if (blendMatch && blendMatch[0]) {
          descriptor = blendMatch[0].trim(); // "Near blend" or "near blend" - preserve original case
          setUserDescriptor(descriptor);
        } else {
          // Just "blend" mentioned, add "near"
          descriptor = "near Blend";
          setUserDescriptor(descriptor);
        }
      }
      
      // Fallback to default if still no descriptor
      if (!descriptor) {
        descriptor = "near Blend";
        setUserDescriptor(descriptor);
      }
      
      // Ensure descriptor is stored in state for future messages
      if (descriptor && descriptor !== userDescriptor) {
        setUserDescriptor(descriptor);
      }
      
      // Coordinates different from current location (37.4275, -122.1697)
      // North entrance coordinates - clearly different (more north and slightly east)
      const coordinates = "(37.4300, -122.1675)";
      const botMessage =
        `Got it. You want to be dropped off **${descriptor.toLowerCase()}**! This is nearest to the **north entrance of CoDa** at coordinates ${coordinates}. Any other specifications?`;
      addBotMessage(botMessage, [`${descriptor.toLowerCase()}`, "north entrance of CoDa", coordinates]);
    } else if (
      lowerInput.includes("stairs") ||
      lowerInput.includes("fountain") ||
      lowerInput.includes("gilbert") ||
      lowerInput.includes("gates") ||
      lowerInput.includes("basement") ||
      (lowerInput.includes("south") && lowerInput.includes("west"))
    ) {
      // Use the descriptor from current input first (descriptorPhrase), then fallback to state
      let descriptor = descriptorPhrase || userDescriptor;
      
      // If still no descriptor, try to extract from current input directly
      if (!descriptor) {
        // Check for specific keywords and extract descriptor
        const keywords = ['gilbert', 'stairs', 'fountain', 'gates', 'basement'];
        for (const keyword of keywords) {
          if (lowerInput.includes(keyword)) {
            // Try to find "near [keyword]" pattern
            const keywordMatch = input.match(new RegExp(`(?:near|close to|by|next to|beside)\\s+${keyword}`, 'i'));
            if (keywordMatch && keywordMatch[0]) {
              descriptor = keywordMatch[0].trim();
            } else {
              // Just keyword mentioned, add "near"
              descriptor = `near ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
            }
            setUserDescriptor(descriptor);
            break;
          }
        }
      }
      
      // Fallback to default if still no descriptor
      if (!descriptor) {
        descriptor = "near the stairs";
      }
      
      // Ensure descriptor is stored in state for future messages
      if (descriptor && descriptor !== userDescriptor) {
        setUserDescriptor(descriptor);
      }
      
      // Coordinates different from current location (37.4275, -122.1697)
      // Southwest entrance coordinates - clearly different
      const coordinates = "(37.4255, -122.1720)";
      const botMessage =
        `Got it. You want to be dropped off **${descriptor.toLowerCase()}**! This is nearest to the **southwest entrance of CoDa** at coordinates ${coordinates}. Any other specifications?`;
      addBotMessage(botMessage, [`${descriptor.toLowerCase()}`, "southwest entrance of CoDa", coordinates]);
    } else if (
      lowerInput.includes("oval") ||
      lowerInput.includes("bikes") ||
      lowerInput.includes("main") ||
      lowerInput.includes("voyager") ||
      lowerInput.includes("coffee") ||
      (lowerInput.includes("east") && !lowerInput.includes("west"))
    ) {
      // Use the descriptor from current input first (descriptorPhrase), then fallback to state
      let descriptor = descriptorPhrase || userDescriptor;
      
      // If still no descriptor, try to extract from current input directly
      if (!descriptor) {
        // Check for specific keywords and extract descriptor
        const keywords = ['oval', 'bikes', 'main', 'voyager', 'coffee'];
        for (const keyword of keywords) {
          if (lowerInput.includes(keyword)) {
            // Try to find "near [keyword]" pattern
            const keywordMatch = input.match(new RegExp(`(?:near|close to|by|next to|beside)\\s+${keyword}`, 'i'));
            if (keywordMatch && keywordMatch[0]) {
              descriptor = keywordMatch[0].trim();
            } else {
              // Just keyword mentioned, add "near"
              descriptor = `near ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
            }
            setUserDescriptor(descriptor);
            break;
          }
        }
      }
      
      // Fallback to default if still no descriptor
      if (!descriptor) {
        descriptor = "near the main entrance";
      }
      
      // Ensure descriptor is stored in state for future messages
      if (descriptor && descriptor !== userDescriptor) {
        setUserDescriptor(descriptor);
      }
      
      // Coordinates different from current location (37.4275, -122.1697)
      // East entrance coordinates - clearly different
      const coordinates = "(37.4290, -122.1665)";
      const botMessage =
        `Got it. You want to be dropped off **${descriptor.toLowerCase()}**! This is nearest to the **east entrance of CoDa** at coordinates ${coordinates}. Any other specifications?`;
      addBotMessage(botMessage, [`${descriptor.toLowerCase()}`, "east entrance of CoDa", coordinates]);
    } else if (
      lowerInput.includes("that's it") ||
      lowerInput.includes("no") ||
      lowerInput.includes("done") ||
      lowerInput.includes("that's all")
    ) {
      const botMessage1 =
        "Great! Converting your location into a pinpoint for your driver.";
      addBotMessage(botMessage1);
      setTimeout(() => {
        const botMessage2 =
          "Secured your dropoff location. Please proceed to complete your ride booking with Boogie!";
        addBotMessage(botMessage2);
      }, 1500);
    } else if (currentDescriptor && !lowerInput.includes("coda") && !lowerInput.includes("computing")) {
      // User provided a descriptor but we haven't matched a specific location yet
      const botMessage =
        `I understand you mentioned "${currentDescriptor}". Could you tell me which building you'd like to be dropped off at?`;
      addBotMessage(botMessage);
    } else {
      const botMessage =
        "I understand. Could you provide more details about your dropoff location?";
      addBotMessage(botMessage);
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
            const cleanText = msg.text.replace(/\*\*/g, '');
            const announcement = `${msg.type === 'user' ? 'You said' : 'BoogieBot said'}: ${cleanText}`;
            AccessibilityInfo.announceForAccessibility?.(announcement);
          }, index * 2000); // 2 second delay between each message
        });
      } else {
        // No screen reader - use TTS to read all messages
        const allText = transcript.map(msg => {
          const cleanText = msg.text.replace(/\*\*/g, '');
          return `${msg.type === 'user' ? 'You said' : 'BoogieBot said'}: ${cleanText}`;
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
      
      if (isScreenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility(
          `${lastMessage.type === 'user' ? 'You said' : 'BoogieBot said'}: ${lastMessage.text}`
        );
      } else {
        Speech.speak(
          `${lastMessage.type === 'user' ? 'You said' : 'BoogieBot said'}: ${lastMessage.text}`,
          {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.9,
          }
        );
      }
    } catch (error) {
      console.error('Error reading last message:', error);
    }
  };

  const handleContinueToConfirmation = () => {
    const dropoffLocation = recognizedLocation || 
      'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305';
    
    navigation.navigate('RideRegistration', {
      pickupLocation: DEFAULT_PICKUP_LOCATION.displayText,
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

    // Clean text for accessibility (remove markdown formatting)
    const cleanText = message.text.replace(/\*\*/g, '');

    return (
      <View
        key={`${message.timestamp}-${message.type}`}
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
          {isUser ? 'User Name:' : 'BoogieBot:'}
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right"]}
    >
      <LinearGradient
        colors={["#09A6B8", "#8A38F5", "#D32EC8", "#ACE347"]}
        style={StyleSheet.absoluteFill} // fills parent completely
        start={{ x: 0, y: 0 }} // top-left
        end={{ x: 1, y: 1 }} // bottom-right
      />
      <BoogieBotHeader />

      {/* <View style={styles.header}>
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
      </View> */}

      {/* <View style={styles.promptContainer}>
        <Text style={styles.prompt} accessibilityRole="header">
          Where would you like to be dropped off?
        </Text>
      </View> */}

      {/* <ScrollView
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
                onBlur={() => Keyboard.dismiss()}
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
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.recordingText}>Listening...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView> */}

      {/* {transcript.length > 0 && (
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
      )} */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: theme.spacing.regular,
    paddingRight: theme.spacing.regular,
  },

  // header: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   paddingHorizontal: 20,
  //   paddingVertical: 16,
  //   borderBottomWidth: 1,
  //   borderBottomColor: colors.border,
  // },
  // backButton: {
  //   width: 40,
  //   height: 40,
  //   justifyContent: 'center',
  //   alignItems: 'flex-start',
  // },
  // backIcon: {
  //   fontSize: 32,
  //   color: colors.text,
  // },
  // logo: {
  //   fontSize: 24,
  //   fontWeight: '600',
  //   color: colors.text,
  // },
  // headerSpacer: {
  //   width: 40,
  // },
  // promptContainer: {
  //   paddingHorizontal: 20,
  //   paddingVertical: 20,
  // },
  // prompt: {
  //   fontSize: 20,
  //   fontWeight: '600',
  //   color: colors.text,
  // },
  // transcriptContainer: {
  //   flex: 1,
  // },
  // transcriptContent: {
  //   padding: 20,
  // },
  // emptyState: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   minHeight: 400,
  // },
  // recordButton: {
  //   width: 80,
  //   height: 80,
  //   borderRadius: 40,
  //   backgroundColor: colors.primary,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginBottom: 20,
  // },
  // recordButtonActive: {
  //   backgroundColor: colors.error,
  // },
  // recordButtonIcon: {
  //   fontSize: 40,
  // },
  // emptyStateText: {
  //   fontSize: 16,
  //   color: colors.textSecondary,
  // },
  // conversationHeader: {
  //   marginBottom: 16,
  //   paddingBottom: 12,
  //   borderBottomWidth: 2,
  //   borderBottomColor: colors.border,
  // },
  // conversationHeaderText: {
  //   fontSize: 16,
  //   fontWeight: '600',
  //   color: colors.text,
  // },
  // messageContainer: {
  //   marginBottom: 16,
  //   padding: 12,
  //   borderRadius: 8,
  //   minHeight: 44, // Ensure minimum touch target size
  // },
  // userMessage: {
  //   backgroundColor: colors.backgroundLight,
  //   alignSelf: 'flex-end',
  //   maxWidth: '85%',
  // },
  // botMessage: {
  //   backgroundColor: colors.background,
  //   alignSelf: 'flex-start',
  //   maxWidth: '85%',
  //   borderWidth: 1,
  //   borderColor: colors.border,
  // },
  // messageLabel: {
  //   fontSize: 12,
  //   fontWeight: '600',
  //   color: colors.textSecondary,
  //   marginBottom: 4,
  // },
  // messageText: {
  //   fontSize: 16,
  //   color: colors.text,
  //   lineHeight: 24,
  // },
  // highlightedText: {
  //   fontWeight: '600',
  //   color: colors.primary,
  // },
  // recordButtonSmall: {
  //   width: 50,
  //   height: 50,
  //   borderRadius: 25,
  //   backgroundColor: colors.primary,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   alignSelf: 'center',
  //   marginTop: 16,
  // },
  // recordButtonSmallIcon: {
  //   fontSize: 24,
  // },
  // recordingIndicator: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginTop: 16,
  //   gap: 8,
  // },
  // recordingText: {
  //   fontSize: 14,
  //   color: colors.primary,
  //   fontWeight: '600',
  // },
  // manualInputContainer: {
  //   marginTop: 20,
  //   paddingTop: 20,
  //   borderTopWidth: 1,
  //   borderTopColor: colors.border,
  // },
  // manualInputLabel: {
  //   fontSize: 14,
  //   color: colors.textSecondary,
  //   marginBottom: 8,
  // },
  // manualInput: {
  //   backgroundColor: colors.backgroundLight,
  //   borderWidth: 1,
  //   borderColor: colors.border,
  //   borderRadius: 8,
  //   padding: 12,
  //   fontSize: 16,
  //   color: colors.text,
  //   marginBottom: 8,
  // },
  // submitButton: {
  //   backgroundColor: colors.primary,
  //   paddingVertical: 12,
  //   paddingHorizontal: 24,
  //   borderRadius: 8,
  //   alignItems: 'center',
  // },
  // submitButtonText: {
  //   color: colors.secondary,
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  // actionButtons: {
  //   padding: 20,
  //   borderTopWidth: 1,
  //   borderTopColor: colors.border,
  //   gap: 12,
  // },
  // readButton: {
  //   backgroundColor: colors.primary,
  //   paddingVertical: 12,
  //   paddingHorizontal: 24,
  //   borderRadius: 8,
  //   alignItems: 'center',
  // },
  // readButtonText: {
  //   color: colors.secondary,
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  // primaryButton: {
  //   backgroundColor: colors.text,
  //   paddingVertical: 14,
  //   paddingHorizontal: 24,
  //   borderRadius: 8,
  //   alignItems: 'center',
  // },
  // primaryButtonText: {
  //   color: colors.secondary,
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  // secondaryButton: {
  //   backgroundColor: colors.backgroundLight,
  //   paddingVertical: 14,
  //   paddingHorizontal: 24,
  //   borderRadius: 8,
  //   alignItems: 'center',
  //   borderWidth: 1,
  //   borderColor: colors.border,
  // },
  // secondaryButtonText: {
  //   color: colors.text,
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
});

export default VoiceInputScreen;
