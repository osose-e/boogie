// // import React, { useEffect, useRef } from 'react';
// // import {
// //   View,
// //   Text,
// //   TouchableOpacity,
// //   StyleSheet,
// //   ScrollView,
// //   SafeAreaView,
// //   AccessibilityInfo,
// //   findNodeHandle,
// // } from 'react-native';
// // import { colors } from '../styles/colors';
// // import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

// // const EntranceSelectScreen = ({ navigation, route }) => {
// //   const { building } = route?.params ?? {};
// //   const titleRef = useRef(null);

// //   useEffect(() => {
// //     const raf = requestAnimationFrame(() => {
// //       const node = findNodeHandle(titleRef.current);
// //       if (node) AccessibilityInfo.setAccessibilityFocus(node);
// //     });
// //     return () => cancelAnimationFrame(raf);
// //   }, []);

// //   const entrances = building?.entrances ?? [];
// //   const onPickEntrance = (entrance) => {
// //     navigation.navigate('RideRegistration', {
// //       pickupLocation: DEFAULT_PICKUP_LOCATION?.displayText ?? 'Pickup location',
// //       dropoffLocation: building?.address ?? '',
// //       dropoffLocationName: building?.name ?? 'Dropoff location',
// //       dropoffEntrance: entrance?.name ?? 'Entrance',
// //       dropoffEntranceId: entrance?.id ?? null,
// //       dropoffBuildingId: building?.id ?? null,
// //       dropoffEntranceDirection: entrance?.direction ?? null,
// //       dropoffEntranceRoad: entrance?.roadSidewalk ?? null,
// //     });
// //   };

// //   const onChatbot = () => {
// //     navigation.navigate('VoiceInput', {
// //       context: 'entrance_help',
// //       locationName: building?.name ?? '',
// //       buildingId: building?.id ?? null,
// //     });
// //   };

// //   return (
// //     <SafeAreaView style={styles.container}>
// //       <View style={styles.headerRow}>
// //         <Text ref={titleRef} style={styles.title} accessibilityRole="header">
// //           Choose an entrance
// //         </Text>

// //         <TouchableOpacity
// //           onPress={() => navigation.goBack()}
// //           accessibilityRole="button"
// //           accessibilityLabel="Back"
// //           accessibilityHint="Returns to the previous screen"
// //         >
// //           <Text style={styles.backLink}>Back</Text>
// //         </TouchableOpacity>
// //       </View>

// //       <ScrollView
// //         style={styles.content}
// //         contentContainerStyle={styles.contentContainer}
// //       >
// //         <Text style={styles.subtitle} accessibilityRole="text">
// //           Choose one of the entrances below for {building?.name ?? 'this location'}.
// //         </Text>
// //         <View style={styles.optionGroup}>
// //           {entrances.map((e) => {
// //             const entranceLabel = e?.name || 'Entrance';
// //             return (
// //               <TouchableOpacity
// //                 key={e.id}
// //                 style={styles.optionCard}
// //                 onPress={() => onPickEntrance(e)}
// //                 accessibilityRole="button"
// //                 accessibilityLabel={entranceLabel}
// //                 accessibilityHint="Select this entrance and continue to ride registration"
// //               >
// //                 <Text style={styles.optionTitle}>{entranceLabel}</Text>
// //               </TouchableOpacity>
// //             );
// //           })}
// //         </View>

// //         <TouchableOpacity
// //           style={styles.helpBox}
// //           onPress={onChatbot}
// //           accessibilityRole="button"
// //           accessibilityLabel="Having trouble selecting the entrance? Use our chatbot."
// //           accessibilityHint="Opens the chatbot to help you choose the correct entrance"
// //         >
// //           <Text style={styles.helpText}>
// //             Having trouble selecting the entrance?
// //           </Text>
// //           <Text style={styles.chatInlineText}>
// //             Use our chatbot
// //           </Text>
// //         </TouchableOpacity>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // };

// // export default EntranceSelectScreen;

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: colors.background },

// //   headerRow: {
// //     flexDirection: 'row',
// //     alignItems: 'baseline',
// //     justifyContent: 'space-between',
// //     paddingHorizontal: 20,
// //     paddingTop: 16,
// //     paddingBottom: 10,
// //     borderBottomWidth: 1,
// //     borderBottomColor: colors.border,
// //   },

// //   title: { fontSize: 18, fontWeight: '700', color: colors.text },
// //   backLink: {
// //     fontSize: 14,
// //     color: colors.primary,
// //     textDecorationLine: 'underline',
// //     fontWeight: '600',
// //   },

// //   content: { flex: 1 },
// //   contentContainer: { padding: 20 },

// //   subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 16 },

// //   optionGroup: { gap: 12 },
// //   optionCard: {
// //     borderRadius: 12,
// //     padding: 16,
// //     borderWidth: 1,
// //     borderColor: colors.border,
// //     backgroundColor: colors.backgroundLight,
// //   },
// //   optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

// //   helpBox: {
// //     marginTop: 20,
// //     borderRadius: 12,
// //     padding: 16,
// //     borderWidth: 1,
// //     borderColor: colors.border,
// //     backgroundColor: colors.backgroundLight,
// //     gap: 10,
// //   },
// //   helpText: { fontSize: 14, color: colors.textSecondary },
// //   chatInlineText: {
// //     fontSize: 16,
// //     fontWeight: '700',
// //     color: colors.primary,
// //   },
// // });
// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   SafeAreaView,
//   AccessibilityInfo,
//   findNodeHandle,
// } from 'react-native';
// import { colors } from '../styles/colors';
// import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

// function getEntranceDescription(e) {
//   const notes = e?.landmarks?.notes?.trim();
//   if (notes) return notes;

//   // Fallback if notes missing
//   const parts = [];

//   if (e?.roadSidewalk) parts.push(`Along ${e.roadSidewalk}.`);

//   const nextTo = e?.landmarks?.nextToBuilding;
//   const acrossFrom = e?.landmarks?.acrossFromBuilding;
//   if (nextTo) parts.push(`Next to ${nextTo}.`);
//   if (acrossFrom) parts.push(`Across from ${acrossFrom}.`);

//   const lm = e?.landmarks || {};
//   const features = [];
//   if (lm.bikeRacks) features.push('bike racks');
//   if (lm.stairs) features.push('stairs');
//   if (lm.fountain) features.push('fountain');
//   if (lm.parkingLot) features.push('parking lot');
//   if (features.length) parts.push(`Near ${features.join(', ')}.`);

//   const other = Array.isArray(lm.other) ? lm.other.filter(Boolean) : [];
//   if (other.length) parts.push(`Landmarks: ${other.slice(0, 2).join(', ')}.`);

//   return parts.join(' ').trim();
// }

// const EntranceSelectScreen = ({ navigation, route }) => {
//   const { building } = route?.params ?? {};
//   const titleRef = useRef(null);

//   useEffect(() => {
//     const raf = requestAnimationFrame(() => {
//       const node = findNodeHandle(titleRef.current);
//       if (node) AccessibilityInfo.setAccessibilityFocus(node);
//     });
//     return () => cancelAnimationFrame(raf);
//   }, []);

//   const entrances = building?.entrances ?? [];

//   const onPickEntrance = (entrance) => {
//     navigation.navigate('RideRegistration', {
//       pickupLocation: DEFAULT_PICKUP_LOCATION?.displayText ?? 'Pickup location',
//       dropoffLocation: building?.address ?? '',
//       dropoffLocationName: building?.name ?? 'Dropoff location',
//       dropoffEntrance: entrance?.name ?? 'Entrance',
//       dropoffEntranceId: entrance?.id ?? null,
//       dropoffBuildingId: building?.id ?? null,
//       dropoffEntranceDirection: entrance?.direction ?? null,
//       dropoffEntranceRoad: entrance?.roadSidewalk ?? null,
//     });
//   };

//   const onChatbot = () => {
//     navigation.navigate('VoiceInput', {
//       context: 'entrance_help',
//       locationName: building?.name ?? '',
//       buildingId: building?.id ?? null,
//     });
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.headerRow}>
//         <Text ref={titleRef} style={styles.title} accessibilityRole="header">
//           Choose an entrance
//         </Text>

//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           accessible
//           accessibilityRole="button"
//           accessibilityLabel="Back"
//           accessibilityHint="Returns to the previous screen"
//         >
//           <Text style={styles.backLink}>Back</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
//         <Text style={styles.subtitle} accessibilityRole="text">
//           For {building?.name ?? 'this location'}. Choose the entrance closest to you.
//         </Text>

//         <View style={styles.optionGroup}>
//           {entrances.map((e) => {
//             const entranceLabel = e?.name || 'Entrance';
//             const desc = getEntranceDescription(e);
//             const direction = e?.direction ? `${e.direction} side. ` : '';
//             const a11yLabel = desc
//               ? `${entranceLabel}. ${direction}${desc}`
//               : `${entranceLabel}. ${direction}`.trim();

//             return (
//               <TouchableOpacity
//                 key={e.id}
//                 style={styles.optionCard}
//                 onPress={() => onPickEntrance(e)}
//                 accessible
//                 accessibilityRole="button"
//                 accessibilityLabel={a11yLabel}
//                 accessibilityHint="Select this entrance and continue to ride registration"
//               >
//                 <Text style={styles.optionTitle}>{entranceLabel}</Text>
//                 {!!desc && <Text style={styles.optionSubtitle}>{desc}</Text>}
//               </TouchableOpacity>
//             );
//           })}
//         </View>

//         <TouchableOpacity
//           style={styles.helpBox}
//           onPress={onChatbot}
//           accessible
//           accessibilityRole="button"
//           accessibilityLabel="Having trouble selecting the entrance? Use our chatbot."
//           accessibilityHint="Opens the chatbot to help you choose the correct entrance"
//         >
//           <Text style={styles.helpText}>Having trouble selecting the entrance?</Text>
//           <Text style={styles.chatInlineText}>Use our chatbot</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default EntranceSelectScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: colors.background },

//   headerRow: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingTop: 16,
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },

//   title: { fontSize: 18, fontWeight: '700', color: colors.text },
//   backLink: {
//     fontSize: 14,
//     color: colors.primary,
//     textDecorationLine: 'underline',
//     fontWeight: '600',
//   },

//   content: { flex: 1 },
//   contentContainer: { padding: 20 },

//   subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 16 },

//   optionGroup: { gap: 12 },
//   optionCard: {
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: colors.border,
//     backgroundColor: colors.backgroundLight,
//   },
//   optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
//   optionSubtitle: {
//     marginTop: 6,
//     fontSize: 14,
//     color: colors.textSecondary,
//     lineHeight: 18,
//   },

//   helpBox: {
//     marginTop: 20,
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: colors.border,
//     backgroundColor: colors.backgroundLight,
//     gap: 10,
//   },
//   helpText: { fontSize: 14, color: colors.textSecondary },
//   chatInlineText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: colors.primary,
//   },
// });
// EntranceSelectScreen.js
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

  const onChatbot = () => {
    navigation.navigate('VoiceInput', {
      context: mode === 'pickup' ? 'pickup_entrance_help' : 'dropoff_entrance_help',
      locationName: building?.name ?? '',
      buildingId: building?.id ?? null,
    });
  };

  const titleText = mode === 'pickup' ? 'Choose a pickup entrance' : 'Choose a dropoff entrance';
  const subtitleText =
    mode === 'pickup'
      ? `For ${building?.name ?? 'this location'}. Choose where your driver should pick you up.`
      : `For ${building?.name ?? 'this location'}. Choose where your driver should drop you off.`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text ref={titleRef} style={styles.title} accessibilityRole="header">
          {titleText}
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
          {subtitleText}
        </Text>

        <View style={styles.optionGroup}>
          {entrances.map((e) => {
            const entranceLabel = e?.name || 'Entrance';
            const desc = getEntranceDescription(e);
            const direction = e?.direction ? `${e.direction} side. ` : '';
            const a11yLabel = desc ? `${entranceLabel}. ${direction}${desc}` : `${entranceLabel}. ${direction}`.trim();

            return (
              <TouchableOpacity
                key={e.id}
                style={styles.optionCard}
                onPress={() => onPickEntrance(e)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
                accessibilityHint={
                  mode === 'pickup'
                    ? 'Select this pickup entrance and then choose your dropoff.'
                    : 'Select this dropoff entrance and continue to ride registration.'
                }
              >
                <Text style={styles.optionTitle}>{entranceLabel}</Text>
                {!!desc && <Text style={styles.optionSubtitle}>{desc}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.helpBox}
          onPress={onChatbot}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Having trouble selecting the entrance? Use our chatbot."
          accessibilityHint="Opens the chatbot to help you choose the correct entrance"
        >
          <Text style={styles.helpText}>Having trouble selecting the entrance?</Text>
          <Text style={styles.chatInlineText}>Use our chatbot</Text>
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