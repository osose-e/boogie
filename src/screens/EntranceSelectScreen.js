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
  const { building } = route?.params ?? {};
  const titleRef = useRef(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Hardcoded entrances for now (same for every location)
  const entrances = building?.entrances ?? [];

  // const onPickEntrance = (entrance) => {
  //   navigation.navigate('RideRegistration', {
  //     pickupLocation: DEFAULT_PICKUP_LOCATION?.displayText ?? 'Pickup location',

  //     // From campusData JSON
  //     dropoffLocation: building?.address ?? '',
  //     dropoffLocationName: building?.name ?? 'Dropoff location',

  //     // New params
  //     dropoffEntrance: entrance.label,
  //     dropoffEntranceId: entrance.id,
  //     dropoffBuildingId: building?.id ?? null,
  //   });
  // };
  const onPickEntrance = (entrance) => {
    navigation.navigate('RideRegistration', {
      pickupLocation: DEFAULT_PICKUP_LOCATION?.displayText ?? 'Pickup location',
      dropoffLocation: building?.address ?? '',
      dropoffLocationName: building?.name ?? 'Dropoff location',
      dropoffEntrance: entrance?.name ?? 'Entrance',
      dropoffEntranceId: entrance?.id ?? null,
      dropoffBuildingId: building?.id ?? null,
      dropoffEntranceDirection: entrance?.direction ?? null,
      dropoffEntranceRoad: entrance?.roadSidewalk ?? null,
    });
  };

  const onChatbot = () => {
    navigation.navigate('VoiceInput', {
      context: 'entrance_help',
      locationName: building?.name ?? '',
      buildingId: building?.id ?? null,
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.subtitle} accessibilityRole="text">
          Choose one of the entrances below for {building?.name ?? 'this location'}.
        </Text>

        {/* <View style={styles.optionGroup}>
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
        </View> */}
        <View style={styles.optionGroup}>
          {entrances.map((e) => {
            const entranceLabel = e?.name || 'Entrance';
            return (
              <TouchableOpacity
                key={e.id}
                style={styles.optionCard}
                onPress={() => onPickEntrance(e)}
                accessibilityRole="button"
                accessibilityLabel={entranceLabel}
                accessibilityHint="Select this entrance and continue to ride registration"
              >
                <Text style={styles.optionTitle}>{entranceLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
  chatInlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});