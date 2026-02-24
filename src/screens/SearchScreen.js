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
// } from 'react-native';
// import { colors } from '../styles/colors';
// import { STANFORD_LOCATIONS } from '../constants/stanfordLocations';

// const SearchScreen = ({ navigation, route }) => {
//   const initialLocation = route?.params?.currentLocation ?? null;

//   const [searchQuery, setSearchQuery] = useState('');
//   const searchInputRef = useRef(null);
//   const titleRef = useRef(null);

//   useEffect(() => {
//     // Focus title first for screen reader context
//     const raf = requestAnimationFrame(() => {
//       const node = findNodeHandle(titleRef.current);
//       if (node) AccessibilityInfo.setAccessibilityFocus(node);
//     });
//     return () => cancelAnimationFrame(raf);
//   }, []);

//   const filteredLocations = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     if (!q) return STANFORD_LOCATIONS;
//     return STANFORD_LOCATIONS.filter((loc) =>
//       loc.name.toLowerCase().includes(q)
//     );
//   }, [searchQuery]);

//   const onSelectLocation = (location) => {
//     // Send selection back to HomeScreen
//     navigation.navigate('Home', { selectedPickupLocation: location });
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text
//           ref={titleRef}
//           accessibilityRole="header"
//           style={styles.title}
//         >
//           Search pickup location
//         </Text>

//         <Text style={styles.subtitle}>
//           Type a building or landmark name.
//         </Text>

//         <TextInput
//           ref={searchInputRef}
//           style={styles.input}
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholder="Search…"
//           placeholderTextColor={colors.textSecondary}
//           autoCorrect={false}
//           autoCapitalize="none"
//           returnKeyType="search"
//           accessibilityLabel="Search pickup locations"
//           accessibilityHint="Type to filter the list of locations"
//         />
//       </View>

//       <ScrollView
//         style={styles.results}
//         contentContainerStyle={styles.resultsContent}
//         keyboardShouldPersistTaps="handled"
//       >
//         {filteredLocations.map((loc) => {
//           const isCurrent = initialLocation?.id === loc.id;

//           return (
//             <TouchableOpacity
//               key={loc.id}
//               style={[styles.resultItem, isCurrent && styles.currentItem]}
//               onPress={() => onSelectLocation(loc)}
//               accessibilityRole="button"
//               accessibilityLabel={`${loc.name}${isCurrent ? ', currently selected' : ''}`}
//               accessibilityHint="Select this pickup location"
//             >
//               <Text style={styles.resultText}>{loc.name}</Text>
//               {isCurrent ? <Text style={styles.currentTag}>Current</Text> : null}
//             </TouchableOpacity>
//           );
//         })}

//         {filteredLocations.length === 0 ? (
//           <Text style={styles.empty}>
//             No matches. Try a different spelling.
//           </Text>
//         ) : null}
//       </ScrollView>

//       <View style={styles.footer}>
//         <TouchableOpacity
//           style={styles.cancelButton}
//           onPress={() => navigation.goBack()}
//           accessibilityRole="button"
//           accessibilityLabel="Go back"
//         >
//           <Text style={styles.cancelText}>Back</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default SearchScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: colors.background },
//   header: { padding: 16, gap: 8 },
//   title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
//   subtitle: { fontSize: 14, color: colors.textSecondary },
//   input: {
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 16,
//     color: colors.textPrimary,
//     backgroundColor: colors.surface,
//   },
//   results: { flex: 1 },
//   resultsContent: { padding: 16, gap: 10 },
//   resultItem: {
//     padding: 14,
//     borderRadius: 12,
//     backgroundColor: colors.surface,
//     borderWidth: 1,
//     borderColor: colors.border,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   currentItem: {
//     borderColor: colors.primary,
//   },
//   resultText: { fontSize: 16, color: colors.textPrimary, flex: 1 },
//   currentTag: { fontSize: 12, color: colors.primary, marginLeft: 10 },
//   empty: { paddingTop: 20, color: colors.textSecondary },
//   footer: { padding: 16 },
//   cancelButton: {
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: colors.border,
//     backgroundColor: colors.surface,
//   },
//   cancelText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
// });

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
import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    // Screen reader: focus the header first so the user knows where they landed
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
    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const sanitizeDictation = (t) =>
    t
      .replace(/\uFFFC/g, '') // remove object-replacement char
      .replace(/\s+/g, ' ')   // collapse whitespace
      .trim();

  const filteredLocations = useMemo(() => {
    if (!searchQuery) return STANFORD_LOCATIONS;
    const q = searchQuery.toLowerCase();
    return STANFORD_LOCATIONS.filter((location) =>
      location.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleLocationSelect = (location) => {
    navigation.navigate('EntranceSelect', {
      location, // pass the whole object for now
    });
  };

//   const handleLocationSelect = (location) => {
//     navigation.navigate('RideRegistration', {
//       pickupLocation: DEFAULT_PICKUP_LOCATION.displayText,
//       dropoffLocation: location.fullAddress,
//       dropoffLocationName: location.name,
//     });
//   };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text
          ref={titleRef}
          style={styles.sectionTitle}
          accessibilityRole="header"
        >
          Search locations
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
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {/* SEARCH */}
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
          <Text
            style={styles.searchIcon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
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
              accessibilityHint="Double tap to set as dropoff location"
            >
              <Text style={styles.locationName}>{location.name}</Text>
              <Text
                style={styles.locationArrow}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  backLink: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

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