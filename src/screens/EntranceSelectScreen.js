import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  AccessibilityInfo,
  findNodeHandle,
} from 'react-native';
import { colors } from '../styles/colors';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

const EntranceSelectScreen = ({ navigation, route }) => {
  const { location } = route?.params ?? {};
  const titleRef = useRef(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Hardcoded entrances for now (same for every location)
  const entrances = [
    { id: 'north', label: 'North entrance' },
    { id: 'south', label: 'South entrance' },
    { id: 'west', label: 'West entrance' },
    { id: 'main', label: 'Main entrance' },
  ];

  const onPickEntrance = (entrance) => {
    navigation.navigate('RideRegistration', {
      pickupLocation: DEFAULT_PICKUP_LOCATION.displayText,
      dropoffLocation: location?.fullAddress ?? '',
      dropoffLocationName: location?.name ?? 'Dropoff location',
      dropoffEntrance: entrance.label, // new param
    });
  };

  const onChatbot = () => {
    // Placeholder: if you don’t have a chatbot screen yet, this can go to VoiceInput for now
    navigation.navigate('VoiceInput', {
      context: 'entrance_help',
      locationName: location?.name ?? '',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text ref={titleRef} style={styles.title} accessibilityRole="header">
          Choose an entrance
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Returns to the previous screen"
        >
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.subtitle} accessibilityRole="text">
          Choose one of the entrances below for {location?.name ?? 'this location'}.
        </Text>

        <View style={styles.optionGroup}>
          {entrances.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={styles.optionCard}
              onPress={() => onPickEntrance(e)}
              accessibilityRole="button"
              accessibilityLabel={e.label}
              accessibilityHint="Select this entrance and continue to ride registration"
            >
              <Text style={styles.optionTitle}>{e.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* <View style={styles.helpBox}>
          <Text style={styles.helpText} accessibilityRole="text">
            Having trouble selecting the entrance?
          </Text>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={onChatbot}
            accessibilityRole="button"
            accessibilityLabel="Use our chatbot"
            accessibilityHint="Opens help to choose the correct entrance"
          >
            <Text style={styles.chatButtonText}>Use our chatbot</Text>
          </TouchableOpacity>
        </View> */}
        <TouchableOpacity
          style={styles.helpBox}
          onPress={onChatbot}
          accessibilityRole="button"
          accessibilityLabel="Having trouble selecting the entrance? Use our chatbot."
          accessibilityHint="Opens the chatbot to help you choose the correct entrance"
        >
          <Text style={styles.helpText}>
            Having trouble selecting the entrance?
          </Text>
          <Text style={styles.chatInlineText}>
            Use our chatbot
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EntranceSelectScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  backLink: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 16 },

  optionGroup: { gap: 12 },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  helpBox: {
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    gap: 10,
  },
  helpText: { fontSize: 14, color: colors.textSecondary },
  chatButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  chatInlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  chatButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});