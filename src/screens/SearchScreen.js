import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import StackHeader from '../components/StackHeader';
import { STANFORD_LOCATIONS } from '../constants/stanfordLocations';
import RideBookingProgressBar from '../components/RideBookingProgressBar';

const SearchScreen = ({ navigation, route }) => {
  const routeName = route?.name ?? '';
  const isPickupSearch = routeName === 'PickupSearch';
  const mode = route?.params?.mode ?? (isPickupSearch ? 'pickup' : 'dropoff');
  const rideDraft = route?.params?.rideDraft ?? {};
  const progressStep = isPickupSearch ? 1 : 3;

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const titleRef = useRef(null);
  const { theme } = useTheme();

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
      .replace(/\s+/g, ' '); // collapse whitespace

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STANFORD_LOCATIONS;
    return STANFORD_LOCATIONS.filter((item) => item.searchBlob.includes(q));
  }, [searchQuery]);

  // CoDa building for "Current location" -> Computing and Data Science entrances screen
  const codaLocation = STANFORD_LOCATIONS.find((loc) => loc.id === 'coda');
  const codaBuilding = codaLocation?.building ?? null;

  // Show "Current location" only when search is empty or query matches current-location terms (e.g. "coda", "current location").
  // If the user types something else (e.g. "Tress"), do not show the Current location option.
  const CURRENT_LOCATION_SEARCH_TERMS = ['current', 'location', 'coda', 'here', 'my location', 'default', 'computing', 'data science'];
  const showCurrentLocationOption = useMemo(() => {
    if (!isPickupSearch || !codaBuilding) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const matchesCurrentLocation = CURRENT_LOCATION_SEARCH_TERMS.some(
      (term) => q.includes(term) || term.includes(q)
    );
    return matchesCurrentLocation;
  }, [isPickupSearch, searchQuery, codaBuilding]);

  const headerText = mode === 'pickup' ? 'Choose Pickup Location' : 'Choose Dropoff Location';
  const navigateTo = mode === 'pickup' ? 'PickupEntranceSelect' : 'DropoffEntranceSelect';
  const hintText =
    mode === 'pickup'
      ? 'Double tap to set as pickup location'
      : 'Double tap to set as dropoff location';

  const handleLocationSelect = (item) => {
    navigation.navigate(navigateTo, {
      mode,
      rideDraft,
      building: item.building, // full building object from JSON
    });
  };

  const handleCurrentLocationSelect = () => {
    if (!codaBuilding) return;
    navigation.navigate('PickupEntranceSelect', {
      mode: 'pickup',
      rideDraft: {},
      building: codaBuilding,
    });
  };

  const handleBack = () => {
    if (mode === "dropoff") {
      // Go back to Entrance 1 (pickup entrance selection)
      navigation.goBack();
    } else {
      // Go back to Home
      navigation.navigate("Home");
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StackHeader title={headerText} onBack={handleBack} ref={titleRef}/>
      {/* <View style={styles.headerRow}>
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
      </View> */}

      <RideBookingProgressBar key={`search-${progressStep}`} completedSteps={progressStep} />

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
          Matching locations ({showCurrentLocationOption ? filteredLocations.length + 1 : filteredLocations.length})
        </Text>

        <View style={styles.locationsList}>
          {showCurrentLocationOption && (
            <TouchableOpacity
              style={styles.locationItem}
              onPress={handleCurrentLocationSelect}
              accessibilityRole="button"
              accessibilityLabel="Current location"
              accessibilityHint="Double tap to choose current location, then select an entrance at Computing and Data Science"
            >
              <Text style={styles.locationName}>Current Location</Text>
              <Text style={styles.locationArrow} accessibilityElementsHidden importantForAccessibility="no">
                ›
              </Text>
            </TouchableOpacity>
          )}
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
  container: { flex: 1 },

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