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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
import { STANFORD_LOCATIONS } from '../constants/stanfordLocations';
import StackHeader from '../components/StackHeader';
import { buildingImages } from "../data/buildingImages";

const SearchScreen = ({ navigation, route }) => {
  const mode = route?.params?.mode ?? 'pickup'; // 'pickup' | 'dropoff'
  const rideDraft = route?.params?.rideDraft ?? {};

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
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STANFORD_LOCATIONS;
    return STANFORD_LOCATIONS.filter((item) => item.searchBlob.includes(q));
  }, [searchQuery]);

  const headerText = mode === 'pickup' ? 'Choose Pickup Location' : 'Choose Dropoff Location';
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StackHeader title={headerText} ref={titleRef} />
      <View style={styles.content}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.background },
          ]}
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

        <ScrollView
          // style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          <Text style={[styles.helperText, { color: theme.colors.body }]} accessibilityRole="text">
            Matching locations ({filteredLocations.length})
          </Text>

          <View style={styles.locationsList}>
            {filteredLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[styles.locationItem, {borderBottomColor: theme.colors.separator}]}
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
                <Text style={[styles.locationName, {color: theme.colors.body}]}>{location.name}</Text>
                {/* <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={theme.colors.chevron}
                  style={{ alignSelf: "center" }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                /> */}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.regular,
    borderColor: "red",
    // borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.regular,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    // color: colors.text
  },
  backLink: {
    fontSize: 14,
    // color: colors.primary,
    textDecorationLine: "underline",
    fontWeight: "600",
  },

  // content: { flex: 1 },
  contentContainer: { paddingVertical: 20 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: colors.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderColor: theme.colors.light.borderColored,
    borderRadius: 100,
    borderWidth: 2,

    // borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    // color: colors.text
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },

  helperText: {
    fontSize: theme.fontSizes.bodySmall,
    fontFamily: theme.fonts.body,
    // color: colors.textSecondary,
    marginBottom: 12,
  },

  locationsList: { marginBottom: 24 },
  locationItem: {
    flexDirection: "row",
    // justifyContent: "space-between",
    // alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    // borderBottomColor: colors.border,
  },
  locationName: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.body,
    // color: colors.text,
    marginTop: theme.spacing.sm,
    width: "65%",
  },
  locationImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
    marginRight: 12,
  },
});

export default SearchScreen;