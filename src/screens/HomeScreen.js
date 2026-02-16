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
import { colors } from '../styles/colors';
import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

const HomeScreen = ({ navigation }) => {
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
  

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo} accessibilityRole="text">
          boogie
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {mode === 'choose' ? (
          <>
            <Text style={styles.title} accessibilityRole="header">
              Pick a dropoff location
            </Text>
            <Text style={styles.subtitle} accessibilityRole="text">
              Select one of the options below.
            </Text>

            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setMode('search')}
                accessibilityRole="button"
                accessibilityLabel="Search locations"
                accessibilityHint="Shows a search field and a list of locations"
              >
                <Text style={styles.optionTitle}>Search locations</Text>
                <Text style={styles.optionDescription}>
                  Type a name and choose from a list.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={goToVoice}
                accessibilityRole="button"
                accessibilityLabel="Use voice assistant"
                accessibilityHint="Opens a voice assistant to choose your destination"
              >
                <Text style={styles.optionTitle}>Use voice assistant</Text>
                <Text style={styles.optionDescription}>
                  Speak your destination instead of browsing.
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.searchHeaderRow}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Search locations
              </Text>

              <TouchableOpacity
                onPress={resetToChooseMode}
                accessibilityRole="button"
                accessibilityLabel="Back to options"
                accessibilityHint="Returns to the two booking options"
              >
                <Text style={styles.backLink}>Back to options</Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH */}
            <View style={styles.searchContainer}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  optionGroup: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
  },
  backLink: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },

  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  currentLocationContainer: { marginBottom: 12 },
  currentLocationLabel: { fontSize: 14, color: colors.textSecondary },

  browseLink: { marginBottom: 20 },
  browseLinkText: {
    fontSize: 14,
    color: colors.primary,
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
    borderBottomColor: colors.border,
  },
  locationName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  locationArrow: {
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: 12,
  },
});

export default HomeScreen;
