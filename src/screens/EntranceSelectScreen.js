import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  findNodeHandle,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from "expo-linear-gradient";
import StackHeader from '../components/StackHeader';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import { entranceImages } from "../data/entranceImages";
import RideBookingProgressBar from '../components/RideBookingProgressBar';
import { StatusBar } from 'expo-status-bar';

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
  const routeName = route?.name ?? '';
  const isPickupEntrance = routeName === 'PickupEntranceSelect';
  const { building, rideDraft = {} } = route?.params ?? {};
  const mode = route?.params?.mode ?? (isPickupEntrance ? 'pickup' : 'dropoff');
  const titleRef = useRef(null);
  const progressStep = isPickupEntrance ? 2 : 4;
  const { theme, themeMode } = useTheme();

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
      navigation.navigate('DropoffSearch', {
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

  const onChatbot = () => {
    const buildingName = building?.name ?? 'this location';
  
    const pickupBuilding = rideDraft?.pickupBuilding ?? null;
    const pickupEntrance = rideDraft?.pickupEntrance ?? null;
  
    const pickupName = pickupBuilding?.name ?? DEFAULT_PICKUP_LOCATION?.displayName ?? 'Pickup location';
    const pickupEntranceName = pickupEntrance?.name ?? 'Pickup entrance';
  
    const seedMessage =
      mode === 'pickup'
        ? `I want to be picked up at ${buildingName}, but I'm not sure which entrance to choose. Please describe the availble entrances and their landmarks.`
        : `I want to be dropped off at ${buildingName}. My pickup is ${pickupName} at ${pickupEntranceName}. I'm not sure which dropoff entrance to choose. Please describe the availble entrances and their landmarks.`;
  
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

  const titleText = mode === 'pickup' ? 'Choose a Pickup Entrance' : 'Choose a Dropoff Entrance';
  const subtitleText =
    mode === 'pickup'
      ? `For ${building?.name ?? 'this location'}. Choose where your driver should pick you up.`
      : `For ${building?.name ?? 'this location'}. Choose where your driver should drop you off.`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={themeMode === "light" ? "dark" : "light"} />
      <StackHeader title={titleText} ref={titleRef} />

      <RideBookingProgressBar
        key={`entrance-${progressStep}`}
        completedSteps={progressStep}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text
          style={[styles.subtitle, { color: theme.colors.body }]}
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
            const image = entranceImages[`${building.id}-${e.id}`]?.[0];

            return (
              <TouchableOpacity
                key={e.id}
                style={[
                  styles.optionCard,
                  { borderTopColor: theme.colors.separator },
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
                {image && (
                  <Image
                    source={image}
                    style={styles.entranceImage}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                )}
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <Text
                    style={[styles.optionTitle, { color: theme.colors.body }]}
                  >
                    {entranceLabel}
                  </Text>
                  {!!desc && (
                    <Text
                      style={[
                        styles.optionSubtitle,
                        { color: theme.colors.body },
                      ]}
                    >
                      {desc}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          // style={[styles.helpBox, { borderColor: theme.colors.border }]}
          onPress={onChatbot}
          accessible
          accessibilityRole="button"
          // accessibilityLabel="Having trouble selecting your entrance? Chat with BoogieBot."
          accessibilityHint="Opens the chatbot to help you choose the correct entrance"
        >
          <LinearGradient
            colors={["#09A6B8", "#8A38F5", "#D32EC8", "#ACE347"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.helpBox}
          >
            <Text style={styles.helpText}>
              Having trouble selecting your entrance?
            </Text>
            <Text style={styles.chatInlineText}>Chat with BoogieBot</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EntranceSelectScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backIcon: {
    fontSize: 32,
    color: colors.text,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: { width: 40 },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  subtitle: { fontSize: 16, fontFamily: theme.fonts.body, marginBottom: 16 },

  optionGroup: {},
  optionCard: {
    // borderRadius: 12,
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    // borderWidth: 1,
    // borderColor: colors.border,
    // backgroundColor: colors.backgroundLight,
  },
  optionTitle: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.header2,
    // color: colors.text
  },
  optionSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    // color: colors.textSecondary,
    lineHeight: 18,
    // width: "60%",
  },
  entranceImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },

  helpBox: {
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    // borderColor: colors.border,
    // backgroundColor: colors.backgroundLight,
    gap: 10,
  },
  helpText: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.dark.body,
  },
  chatInlineText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: theme.fonts.header2,
    color: theme.colors.dark.body,
  },
});