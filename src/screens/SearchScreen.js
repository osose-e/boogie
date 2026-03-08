// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   SafeAreaView,
//   AccessibilityInfo,
//   findNodeHandle,
//   Keyboard,
// } from 'react-native';
// import { colors } from '../styles/colors';
// import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

// const SearchScreen = ({ navigation }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const searchInputRef = useRef(null);
//   const titleRef = useRef(null);

//   useEffect(() => {
//     // Screen reader: focus the header first so the user knows where they landed
//     const raf = requestAnimationFrame(() => {
//       const node = findNodeHandle(titleRef.current);
//       if (node) AccessibilityInfo.setAccessibilityFocus(node);
//     });
//     return () => cancelAnimationFrame(raf);
//   }, []);

//   useEffect(() => {
//     const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
//       Keyboard.dismiss();
//     });
//     return () => {
//       keyboardDidHideListener.remove();
//     };
//   }, []);

//   const sanitizeDictation = (t) =>
//     t
//       .replace(/\uFFFC/g, '') // remove object-replacement char
//       .replace(/\s+/g, ' ')   // collapse whitespace
//       .trim();

// //   const filteredLocations = useMemo(() => {
// //     if (!searchQuery) return STANFORD_LOCATIONS;
// //     const q = searchQuery.toLowerCase();
// //     return STANFORD_LOCATIONS.filter((location) =>
// //       location.name.toLowerCase().includes(q)
// //     );
// //   }, [searchQuery]);
//     const filteredLocations = useMemo(() => {
//         const q = searchQuery.trim().toLowerCase();
//         if (!q) return STANFORD_LOCATIONS;
//         return STANFORD_LOCATIONS.filter((item) => item.searchBlob.includes(q));
//     }, [searchQuery]);

//     const handleLocationSelect = (item) => {
//         navigation.navigate('EntranceSelect', {
//           building: item.building, // full building object from JSON
//         });
//       };

// //   const handleLocationSelect = (location) => {
// //     navigation.navigate('EntranceSelect', {
// //       location, // pass the whole object for now
// //     });
// //   };


//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.headerRow}>
//         <Text
//           ref={titleRef}
//           style={styles.sectionTitle}
//           accessibilityRole="header"
//         >
//           Search locations
//         </Text>

//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           accessibilityRole="button"
//           accessibilityLabel="Back"
//           accessibilityHint="Returns to the previous screen"
//         >
//           <Text style={styles.backLink}>Back</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={styles.content}
//         contentContainerStyle={styles.contentContainer}
//         keyboardShouldPersistTaps="handled"
//         onScrollBeginDrag={() => Keyboard.dismiss()}
//       >
//         {/* SEARCH */}
//         <View style={styles.searchContainer}>
//           <TextInput
//             ref={searchInputRef}
//             style={styles.searchInput}
//             placeholder="Find locations by name..."
//             placeholderTextColor={colors.textSecondary}
//             value={searchQuery}
//             onChangeText={(t) => setSearchQuery(sanitizeDictation(t))}
//             autoCorrect={false}
//             spellCheck={false}
//             autoCapitalize="none"
//             accessibilityLabel="Search for locations by name"
//             accessibilityRole="searchbox"
//             returnKeyType="search"
//           />
//           <Text
//             style={styles.searchIcon}
//             accessibilityElementsHidden
//             importantForAccessibility="no"
//           >
//             🔍
//           </Text>
//         </View>

//         <Text style={styles.helperText} accessibilityRole="text">
//           Matching locations ({filteredLocations.length})
//         </Text>

//         <View style={styles.locationsList}>
//           {filteredLocations.map((location) => (
//             <TouchableOpacity
//               key={location.id}
//               style={styles.locationItem}
//               onPress={() => handleLocationSelect(location)}
//               accessibilityRole="button"
//               accessibilityLabel={location.name}
//               accessibilityHint="Double tap to set as dropoff location"
//             >
//               <Text style={styles.locationName}>{location.name}</Text>
//               <Text
//                 style={styles.locationArrow}
//                 accessibilityElementsHidden
//                 importantForAccessibility="no"
//               >
//                 ›
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

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

//   sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
//   backLink: {
//     fontSize: 14,
//     color: colors.primary,
//     textDecorationLine: 'underline',
//     fontWeight: '600',
//   },

//   content: { flex: 1 },
//   contentContainer: { padding: 20 },

//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.backgroundLight,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   searchInput: { flex: 1, fontSize: 16, color: colors.text },
//   searchIcon: { fontSize: 20, marginLeft: 8 },

//   helperText: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },

//   locationsList: { marginBottom: 24 },
//   locationItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   locationName: { fontSize: 16, color: colors.text, flex: 1 },
//   locationArrow: { fontSize: 24, color: colors.textSecondary, marginLeft: 12 },
// });

// export default SearchScreen;
// SearchScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { colors } from '../styles/colors';
import { STANFORD_LOCATIONS } from '../constants/stanfordLocations';
import RideBookingProgressBar from '../components/RideBookingProgressBar';

const SearchScreen = ({ navigation, route }) => {
  const mode = route?.params?.mode ?? 'pickup'; // 'pickup' | 'dropoff'
  const rideDraft = route?.params?.rideDraft ?? {};

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Keyboard.dismiss();
    });
    return () => keyboardDidHideListener.remove();
  }, []);

  const sanitizeDictation = (t) =>
    t
      .replace(/\uFFFC/g, '') // remove object-replacement char
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STANFORD_LOCATIONS;
    return STANFORD_LOCATIONS.filter((item) => item.searchBlob.includes(q));
  }, [searchQuery]);

  const headerText = mode === 'pickup' ? 'Choose pickup location' : 'Choose dropoff location';
  const hintText =
    mode === 'pickup'
      ? 'Double tap to set as pickup location'
      : 'Double tap to set as dropoff location';

  const handleLocationSelect = (item) => {
    navigation.navigate('EntranceSelect', {
      mode,
      rideDraft,
      building: item.building, // full building object from JSON
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text ref={titleRef} style={styles.sectionTitle} accessibilityRole="header">
          {headerText}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <RideBookingProgressBar completedSteps={mode === 'pickup' ? 0 : 1} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <View style={styles.searchContainer}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Find locations by name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(t) => setSearchQuery(sanitizeDictation(t))}
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
            accessibilityLabel="Search for locations by name"
            accessibilityRole="searchbox"
            returnKeyType="search"
          />
          <Text style={styles.searchIcon} accessibilityElementsHidden importantForAccessibility="no">
            🔍
          </Text>
        </View>

        <Text style={styles.helperText} accessibilityRole="text">
          Matching locations ({filteredLocations.length})
        </Text>

        <View style={styles.locationsList}>
          {filteredLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.locationItem}
              onPress={() => handleLocationSelect(location)}
              accessibilityRole="button"
              accessibilityLabel={location.name}
              accessibilityHint={hintText}
            >
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationArrow} accessibilityElementsHidden importantForAccessibility="no">
                ›
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  searchIcon: { fontSize: 20, marginLeft: 8 },

  helperText: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },

  locationsList: { marginBottom: 24 },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationName: { fontSize: 16, color: colors.text, flex: 1 },
  locationArrow: { fontSize: 24, color: colors.textSecondary, marginLeft: 12 },
});

export default SearchScreen;