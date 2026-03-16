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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import { buildingImages } from "../data/buildingImages";
import StackHeader from '../components/StackHeader';
import { Ionicons } from "@expo/vector-icons";
import { STANFORD_LOCATIONS } from '../constants/stanfordLocations';
import RideBookingProgressBar from '../components/RideBookingProgressBar';
import { StatusBar } from 'expo-status-bar';

const SearchScreen = ({ navigation, route }) => {
  const routeName = route?.name ?? '';
  const isPickupSearch = routeName === 'PickupSearch';
  const mode = route?.params?.mode ?? (isPickupSearch ? 'pickup' : 'dropoff');
  const rideDraft = route?.params?.rideDraft ?? {};
  const progressStep = isPickupSearch ? 1 : 3;

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const titleRef = useRef(null);
  const { theme, themeMode } = useTheme();

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={themeMode === "light" ? "dark" : "light"} />
      <StackHeader title={headerText} onBack={handleBack} ref={titleRef} />
      <RideBookingProgressBar
        key={`search-${progressStep}`}
        completedSteps={progressStep}
      />

      <View
        style={[styles.searchContainer, { borderColor: theme.colors.border }]}
      >
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Find locations by name..."
          placeholderTextColor={theme.colors.bodyPlaceholder}
          value={searchQuery}
          onChangeText={(t) => setSearchQuery(sanitizeDictation(t))}
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="none"
          accessibilityLabel="Search for locations by name"
          accessibilityRole="searchbox"
          returnKeyType="search"
        />
        <Ionicons
          name="search"
          size={24}
          color={theme.colors.icons}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <Text
        style={[styles.helperText, { color: theme.colors.body }]}
        accessibilityRole="text"
      >
        Matching Locations (
        {showCurrentLocationOption
          ? filteredLocations.length + 1
          : filteredLocations.length}
        )
      </Text>

      <ScrollView
        style={[styles.content, { borderTopColor: theme.colors.border }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {showCurrentLocationOption && (
          <TouchableOpacity
            style={styles.curLocButton}
            onPress={handleCurrentLocationSelect}
            accessibilityRole="button"
            accessibilityLabel="Current location"
            accessibilityHint="Double tap to choose current location, then select an entrance at Computing and Data Science"
          >
            <Text style={[styles.locationName, { fontFamily: theme.fonts.header3, color: theme.colors.background }]}>
              Use Current Location
            </Text>
          </TouchableOpacity>

          // <TouchableOpacity
          //   style={[
          //     styles.locationItem,
          //     { borderBottomColor: theme.colors.separator },
          //   ]}
          //   onPress={handleCurrentLocationSelect}
          //   accessibilityRole="button"
          //   accessibilityLabel="Current location"
          //   accessibilityHint="Double tap to choose current location, then select an entrance at Computing and Data Science"
          // >
          //   <Text style={[styles.locationName, { color: theme.colors.body }]}>
          //     Current Location
          //   </Text>
          //   <Ionicons
          //     name="chevron-forward"
          //     size={24}
          //     color={theme.colors.chevron}
          //     style={{ alignSelf: "center" }}
          //     accessibilityElementsHidden
          //     importantForAccessibility="no"
          //   />
          // </TouchableOpacity>
        )}
        {filteredLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[
              styles.locationItem,
              { borderTopColor: theme.colors.separator },
            ]}
            onPress={() => handleLocationSelect(location)}
            accessibilityRole="button"
            accessibilityLabel={location.name}
            accessibilityHint={hintText}
          >
            <Image
              source={buildingImages[location.building.id]}
              style={styles.locationImage}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.locationName, { color: theme.colors.body }]}>
              {location.name}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.chevron}
              style={{ alignSelf: "center" }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </TouchableOpacity>
        ))}

        {/* {filteredLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.locationItem}
            onPress={() => handleLocationSelect(location)}
            accessibilityRole="button"
            accessibilityLabel={location.name}
            accessibilityHint={hintText}
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
        ))} */}
        {/* <View style={styles.locationsList}></View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: { flex: 1, borderTopWidth: 2 },
  contentContainer: { paddingHorizontal: theme.spacing.lg },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginTop: theme.spacing.regular,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: theme.fonts.body },
  searchIcon: { fontSize: 20, marginLeft: 8 },

  helperText: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    marginBottom: 8,
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },

  locationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  locationName: { fontSize: 16, fontFamily: theme.fonts.body, flex: 1 },
  locationArrow: { fontSize: 24, marginLeft: 12 },
  locationImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
    marginRight: 12,
  },
  curLocButton: {
    borderRadius: 100,
    backgroundColor: theme.colors.light.primary,
    marginVertical: theme.spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.regular,
    alignItems: "center",
  },
});

export default SearchScreen;