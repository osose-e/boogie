import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { useTheme } from "../contexts/ThemeContext";

function getEntranceDescription(e) {
  const notes = e?.landmarks?.notes?.trim();
  if (notes) return notes;

  const parts = [];

  if (e?.roadSidewalk) parts.push(`Along ${e.roadSidewalk}.`);

  const nextTo = e?.landmarks?.nextToBuilding;
  const acrossFrom = e?.landmarks?.acrossFromBuilding;
  if (nextTo) parts.push(`Next to ${nextTo}.`);
  if (acrossFrom) parts.push(`Across from ${acrossFrom}.`);

  const lm = e?.landmarks || {};
  const features = [];
  if (lm.bikeRacks) features.push('bike racks');
  if (lm.stairs) features.push('stairs');
  if (lm.fountain) features.push('fountain');
  if (lm.parkingLot) features.push('parking lot');
  if (features.length) parts.push(`Near ${features.join(', ')}.`);

  const other = Array.isArray(lm.other) ? lm.other.filter(Boolean) : [];
  if (other.length) parts.push(`Landmarks: ${other.slice(0, 2).join(', ')}.`);

  return parts.join(' ').trim();
}

const EntranceSelectScreen = ({ navigation, route }) => {
  const { building, mode = 'pickup', rideDraft = {} } = route?.params ?? {};
  const titleRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const entrances = building?.entrances ?? [];

  const onPickEntrance = (entrance) => {
    if (mode === 'pickup') {
      const nextDraft = {
        ...rideDraft,
        pickupBuilding: building,
        pickupEntrance: entrance,
      };

      // NOTE: If your navigator uses a different name than 'Search', change it here.
      navigation.navigate('Search', {
        mode: 'dropoff',
        rideDraft: nextDraft,
      });
      return;
    }

    // mode === 'dropoff' -> finalize and go to RideRegistration
    const pickupBuilding = rideDraft?.pickupBuilding ?? null;
    const pickupEntrance = rideDraft?.pickupEntrance ?? null;

    navigation.navigate('RideRegistration', {
      // Pickup (if user never set it, fall back to DEFAULT_PICKUP_LOCATION)
      pickupLocation: pickupBuilding?.address ?? DEFAULT_PICKUP_LOCATION?.displayText ?? 'Pickup location',
      pickupLocationName: pickupBuilding?.name ?? DEFAULT_PICKUP_LOCATION?.displayName ?? 'Pickup location',
      pickupEntrance: pickupEntrance?.name ?? 'Pickup entrance',
      pickupEntranceId: pickupEntrance?.id ?? null,
      pickupBuildingId: pickupBuilding?.id ?? null,
      pickupEntranceDirection: pickupEntrance?.direction ?? null,
      pickupEntranceRoad: pickupEntrance?.roadSidewalk ?? null,

      // Dropoff (current selection)
      dropoffLocation: building?.address ?? '',
      dropoffLocationName: building?.name ?? 'Dropoff location',
      dropoffEntrance: entrance?.name ?? 'Dropoff entrance',
      dropoffEntranceId: entrance?.id ?? null,
      dropoffBuildingId: building?.id ?? null,
      dropoffEntranceDirection: entrance?.direction ?? null,
      dropoffEntranceRoad: entrance?.roadSidewalk ?? null,
    });
  };

  // const onChatbot = () => {
  //   navigation.navigate('VoiceInput', {
  //     context: mode === 'pickup' ? 'pickup_entrance_help' : 'dropoff_entrance_help',
  //     locationName: building?.name ?? '',
  //     buildingId: building?.id ?? null,
  //   });
  // };
  const onChatbot = () => {
    const buildingName = building?.name ?? 'this location';
  
    const pickupBuilding = rideDraft?.pickupBuilding ?? null;
    const pickupEntrance = rideDraft?.pickupEntrance ?? null;
  
    const pickupName = pickupBuilding?.name ?? DEFAULT_PICKUP_LOCATION?.displayName ?? 'Pickup location';
    const pickupEntranceName = pickupEntrance?.name ?? 'Pickup entrance';
  
    const seedMessage =
      mode === 'pickup'
        ? `I want to be picked up at ${buildingName}, but I'm not sure which entrance to choose.`
        : `I want to be dropped off at ${buildingName}. My pickup is ${pickupName} at ${pickupEntranceName}. I'm not sure which dropoff entrance to choose.`;
  
    navigation.navigate('VoiceInput', {
      // keep your existing params
      context: mode === 'pickup' ? 'pickup_entrance_help' : 'dropoff_entrance_help',
      locationName: buildingName,
      buildingId: building?.id ?? null,
  
      // ✅ new
      seedMessage,
      structuredContext: {
        screen: 'EntranceSelectScreen',
        intent: 'choose_entrance',
        mode, // 'pickup' | 'dropoff'
  
        // current building user is choosing an entrance for
        buildingId: building?.id ?? null,
        buildingName,
  
        // ✅ include pickup details when available
        pickup: pickupBuilding
          ? {
              buildingId: pickupBuilding?.id ?? null,
              buildingName: pickupBuilding?.name ?? pickupName,
              entranceId: pickupEntrance?.id ?? null,
              entranceName: pickupEntrance?.name ?? pickupEntranceName,
              entranceDirection: pickupEntrance?.direction ?? null,
              entranceRoad: pickupEntrance?.roadSidewalk ?? null,
            }
          : {
              buildingId: null,
              buildingName: pickupName,
              entranceId: null,
              entranceName: pickupEntranceName,
              entranceDirection: null,
              entranceRoad: null,
            },
  
        // entrances available on *current* building (pickup or dropoff)
        entrances: (building?.entrances ?? []).map((e) => ({
          id: e?.id ?? null,
          name: e?.name ?? '',
          direction: e?.direction ?? null,
          roadSidewalk: e?.roadSidewalk ?? null,
          description: getEntranceDescription(e) || null,
        })),
      },
    });
  };

  const titleText = mode === 'pickup' ? 'Choose a pickup entrance' : 'Choose a dropoff entrance';
  const subtitleText =
    mode === 'pickup'
      ? `For ${building?.name ?? 'this location'}. Choose where your driver should pick you up.`
      : `For ${building?.name ?? 'this location'}. Choose where your driver should drop you off.`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.headerRow, { borderBottomColor: theme.colors.border }]}
      >
        <Text
          ref={titleRef}
          style={[styles.title, { color: theme.colors.text }]}
          accessibilityRole="header"
        >
          {titleText}
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Returns to the previous screen"
        >
          <Text style={[styles.backLink, { color: theme.colors.primary }]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text
          style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          accessibilityRole="text"
        >
          {subtitleText}
        </Text>

        <View style={styles.optionGroup}>
          {entrances.map((e) => {
            const entranceLabel = e?.name || "Entrance";
            const desc = getEntranceDescription(e);
            const direction = e?.direction ? `${e.direction} side. ` : "";
            const a11yLabel = desc
              ? `${entranceLabel}. ${direction}${desc}`
              : `${entranceLabel}. ${direction}`.trim();

            return (
              <TouchableOpacity
                key={e.id}
                style={[
                  styles.optionCard,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.backgroundLight,
                  },
                ]}
                onPress={() => onPickEntrance(e)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
                accessibilityHint={
                  mode === "pickup"
                    ? "Select this pickup entrance and then choose your dropoff."
                    : "Select this dropoff entrance and continue to ride registration."
                }
              >
                <Text style={styles.optionTitle}>{entranceLabel}</Text>
                {!!desc && <Text style={styles.optionSubtitle}>{desc}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.helpBox,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.backgroundLight,
            },
          ]}
          onPress={onChatbot}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Having trouble selecting the entrance? Use our chatbot."
          accessibilityHint="Opens the chatbot to help you choose the correct entrance"
        >
          <Text style={styles.helpText}>
            Having trouble selecting the entrance?
          </Text>
          <Text style={styles.chatInlineText}>Use our chatbot</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EntranceSelectScreen;

const styles = StyleSheet.create({
  container: { flex: 1,  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },

  title: { fontSize: 18, fontWeight: '700', },
  backLink: {
    fontSize: 14,

    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  subtitle: { fontSize: 16, marginBottom: 16 },

  optionGroup: { gap: 12 },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,

  },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  helpBox: {
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,

    gap: 10,
  },
  helpText: { fontSize: 14, color: colors.textSecondary },
  chatInlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.light.primary,
  },
});