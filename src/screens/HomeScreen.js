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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { lightColors } from '../styles/colors';
import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

const fallbackColors = lightColors;

const HomeScreen = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState('choose'); // 'choose' | 'search'
  const searchInputRef = useRef(null);

  const filteredLocations = useMemo(() => {
    if (!searchQuery) return STANFORD_LOCATIONS;
    const q = searchQuery.toLowerCase();
    return STANFORD_LOCATIONS.filter((location) =>
      location.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleLocationSelect = (location) => {
    navigation.navigate('RideRegistration', {
      pickupLocation: DEFAULT_PICKUP_LOCATION.fullAddress,
      dropoffLocation: location.fullAddress,
      dropoffLocationName: location.name,
    });
  };

  const goToVoice = () => navigation.navigate('VoiceInput');

  const resetToChooseMode = () => {
    setMode('choose');
    setSearchQuery('');
  };

  useEffect(() => {
    if (mode !== 'search') return;
  
    const raf = requestAnimationFrame(() => {
      const node = findNodeHandle(searchInputRef.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    });
  
    return () => cancelAnimationFrame(raf);
  }, [mode]);
  

  const themed = {
    container: { backgroundColor: colors.background },
    header: { borderBottomColor: colors.border },
    logo: { color: colors.text },
    title: { color: colors.text },
    subtitle: { color: colors.textSecondary },
    optionCard: { borderColor: colors.border, backgroundColor: colors.backgroundLight },
    optionTitle: { color: colors.text },
    optionDescription: { color: colors.textSecondary },
    sectionTitle: { color: colors.text },
    backLink: { color: colors.primary },
    searchContainer: { backgroundColor: colors.backgroundLight, borderColor: colors.border },
    searchInput: { color: colors.text },
    helperText: { color: colors.textSecondary },
    locationItem: { borderBottomColor: colors.border },
    locationName: { color: colors.text },
    locationArrow: { color: colors.textSecondary },
  };

  return (
    <SafeAreaView style={[styles.container, themed.container]}>
      <View style={[styles.header, themed.header]}>
        <Text style={[styles.logo, themed.logo]} accessibilityRole="text">
          boogie
        </Text>
        <TouchableOpacity
          onPress={toggleTheme}
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={styles.themeToggle}
        >
          <Text style={{ fontSize: 22, color: colors.text }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {mode === 'choose' ? (
          <>
            <Text style={[styles.title, themed.title]} accessibilityRole="header">
              Book a ride
            </Text>
            <Text style={[styles.subtitle, themed.subtitle]} accessibilityRole="text">
              Choose how you'd like to schedule your campus ride.
            </Text>

            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={[styles.optionCard, themed.optionCard]}
                onPress={() => setMode('search')}
                accessibilityRole="button"
                accessibilityLabel="Search locations"
                accessibilityHint="Shows a search field and a list of locations"
              >
                <Text style={[styles.optionTitle, themed.optionTitle]}>Search locations</Text>
                <Text style={[styles.optionDescription, themed.optionDescription]}>
                  Type a building or place name and pick from the list.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, themed.optionCard]}
                onPress={goToVoice}
                accessibilityRole="button"
                accessibilityLabel="Talk to dispatcher"
                accessibilityHint="Opens the dispatcher chat to describe your drop-off using landmarks or voice"
              >
                <Text style={[styles.optionTitle, themed.optionTitle]}>Talk to dispatcher</Text>
                <Text style={[styles.optionDescription, themed.optionDescription]}>
                  Chat with BoogieBot. Say your destination and entrance (e.g. "CoDa, north entrance by the Blend").
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.searchHeaderRow}>
              <Text style={[styles.sectionTitle, themed.sectionTitle]} accessibilityRole="header">
                Search locations
              </Text>

              <TouchableOpacity
                onPress={resetToChooseMode}
                accessibilityRole="button"
                accessibilityLabel="Back to options"
                accessibilityHint="Returns to the two booking options"
              >
                <Text style={[styles.backLink, themed.backLink]}>Back to options</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, themed.searchContainer]}>
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, themed.searchInput]}
                placeholder="Find locations by name..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
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

            <Text style={[styles.helperText, themed.helperText]} accessibilityRole="text">
              Matching locations ({filteredLocations.length})
            </Text>

            <View style={styles.locationsList}>
              {filteredLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[styles.locationItem, themed.locationItem]}
                  onPress={() => handleLocationSelect(location)}
                  accessibilityRole="button"
                  accessibilityLabel={location.name}
                  accessibilityHint="Double tap to set as dropoff location"
                >
                  <Text style={[styles.locationName, themed.locationName]}>{location.name}</Text>
                  <Text
                    style={[styles.locationArrow, themed.locationArrow]}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  themeToggle: {
    padding: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
  },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: fallbackColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: fallbackColors.textSecondary,
    marginBottom: 16,
  },

  optionGroup: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: fallbackColors.border,
    backgroundColor: fallbackColors.backgroundLight,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: fallbackColors.text,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: fallbackColors.textSecondary,
  },

  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: fallbackColors.text,
  },
  backLink: {
    fontSize: 14,
    color: fallbackColors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: fallbackColors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: fallbackColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: fallbackColors.text,
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },

  helperText: {
    fontSize: 14,
    color: fallbackColors.textSecondary,
    marginBottom: 12,
  },

  currentLocationContainer: { marginBottom: 12 },
  currentLocationLabel: { fontSize: 14, color: fallbackColors.textSecondary },

  browseLink: { marginBottom: 20 },
  browseLinkText: {
    fontSize: 14,
    color: fallbackColors.primary,
    textDecorationLine: 'underline',
  },

  locationsList: { marginBottom: 24 },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: fallbackColors.border,
  },
  locationName: {
    fontSize: 16,
    color: fallbackColors.text,
    flex: 1,
  },
  locationArrow: {
    fontSize: 24,
    color: fallbackColors.textSecondary,
    marginLeft: 12,
  },
});

export default HomeScreen;
