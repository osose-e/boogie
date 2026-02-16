import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors } from '../styles/colors';
import { STANFORD_LOCATIONS, DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = searchQuery
    ? STANFORD_LOCATIONS.filter((location) =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : STANFORD_LOCATIONS;

  const handleLocationSelect = (location) => {
    navigation.navigate('RideRegistration', {
      pickupLocation: DEFAULT_PICKUP_LOCATION.fullAddress,
      dropoffLocation: location.fullAddress,
      dropoffLocationName: location.name,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.logo} accessibilityRole="text">
          boogie
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Text style={styles.headerIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Find locations by name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search for locations by name"
            accessibilityRole="searchbox"
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        <View style={styles.currentLocationContainer}>
          <Text style={styles.currentLocationLabel} accessibilityRole="text">
            Current location: {DEFAULT_PICKUP_LOCATION.address}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.browseLink}
          accessibilityRole="button"
          accessibilityLabel="Browse nearby locations"
        >
          <Text style={styles.browseLinkText}>Browse nearby locations.</Text>
        </TouchableOpacity>

        <View style={styles.locationsList}>
          {filteredLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.locationItem}
              onPress={() => handleLocationSelect(location)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${location.name} as dropoff location`}
            >
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.voiceButton}
        onPress={() => navigation.navigate('VoiceInput')}
        accessibilityRole="button"
        accessibilityLabel="Open voice input to select destination"
        accessibilityHint="Double tap to start voice input for selecting your destination"
      >
        <Text style={styles.voiceButtonIcon}>🎤</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
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
  currentLocationContainer: {
    marginBottom: 12,
  },
  currentLocationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  browseLink: {
    marginBottom: 20,
  },
  browseLinkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  locationsList: {
    marginBottom: 100,
  },
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
  voiceButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  voiceButtonIcon: {
    fontSize: 32,
  },
});

export default HomeScreen;
