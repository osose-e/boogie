import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
  FlatList,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from "expo-location";
import { theme } from '../styles/themes';
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Header from '../components/TabHeader';

const HomeScreen = ({ navigation }) => {
  const headerRef = useRef(null);
  const nearbyHeaderRef = useRef(null);
  const [justGranted, setJustGranted] = useState(false);

  // Focus on header when screen loads
  useFocusEffect(
    React.useCallback(() => {
      const raf = requestAnimationFrame(() => {
        const node = findNodeHandle(headerRef.current);
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }
      });

      return () => cancelAnimationFrame(raf);
    }, []),
  );

  const { theme } = useTheme();
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [locations, setLocations] = useState([]);
  const locationName = "Lathrop Library";
  const locationAddress = "518 Memorial Way, Stanford, CA 94305";

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);

    if (status === "granted") {
      loadNearbyLocations();
    }
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    setPermissionStatus(status);

    if (status === "granted") {
      setJustGranted(true);
      loadNearbyLocations();
    }
  };

  useEffect(() => {
    if (justGranted) {
      const timeout = setTimeout(() => {
        const node = findNodeHandle(nearbyHeaderRef.current);
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }

        AccessibilityInfo.announceForAccessibility(
          "Location permission granted. Nearby locations loaded.",
        );
      }, 100); // small delay ensures element is rendered

      setJustGranted(false);
      return () => clearTimeout(timeout);
    }
  }, [permissionStatus]);

  const loadNearbyLocations = async () => {
    // Example mock data — replace with real fetch logic
    setLocations([
      { id: "1", name: "Computing and Data Science (CoDa)" },
      { id: "2", name: "Wallenberg Hall" },
      { id: "3", name: "McLatchy Hall" },
    ]);
  };

  const goToSearch = () => navigation.navigate("Search");
  const goToVoice = () => navigation.navigate('VoiceInput');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right"]}
    >
      <Header />
      <Text
        style={[styles.title, { color: theme.colors.header2 }]}
        ref={headerRef}
        accessible={true}
        focusable={true}
        accessibilityRole="header"
      >
        Find your drop-off location
      </Text>
      <Text
        style={[styles.subtitle, { color: theme.colors.bodyDark }]}
        accessibilityRole="text"
      >
        Select one of the options below:
      </Text>

      <View style={styles.optionGroup}>
        <TouchableOpacity
          style={[
            styles.searchOptionCard,
            {
              borderColor: theme.colors.borderDark,
              backgroundColor: theme.colors.background,
            },
          ]}
          onPress={goToSearch}
          accessibilityRole="button"
        >
          <Text
            style={[styles.searchOptionTitle, { color: theme.colors.bodyDark }]}
          >
            Search for a destination
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToVoice}
          accessibilityRole="button"
          // accessibilityLabel="Chat with BoogieBot voice assistant"
          accessibilityHint="Opens a voice assistant to help choose your destination"
        >
          <LinearGradient
            colors={["#09A6B8", "#8A38F5", "#D32EC8", "#ACE347"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.chatOptionCard,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={[styles.chatOptionTitle, { color: "#FFFFFF" }]}>
              Chat with BoogieBot
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {permissionStatus === "granted" ? (
          <View>
            <Text
              style={[
                styles.title,
                { color: theme.colors.header2, marginTop: 0 },
              ]}
              accessibilityRole="header"
              ref={nearbyHeaderRef}
            >
              Browse nearby locations:
            </Text>
            <Text
              style={[styles.curLoc, { color: theme.colors.textAddress }]}
              numberOfLines={1}
              ellipsizeMode="tail"
              accessibilityLabel={`Current location: ${locationName}, ${locationAddress}`}
            >
              Current location:{" "}
              <Text style={{ fontFamily: theme.fonts.header2 }}>
                {locationName}
              </Text>
              , {locationAddress}
            </Text>
            <FlatList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() =>
                    navigation.navigate("LocationDetails", { id: item.id })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                >
                  <Text
                    style={[styles.loc, { color: theme.colors.bodyDark }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={24}
                    color={theme.colors.arrow}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: theme.colors.separator },
                  ]}
                />
              )}
              style={{ marginHorizontal: theme.spacing.xs }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.browseOptionCard,
              { backgroundColor: theme.colors.wordmark.primary },
            ]}
            onPress={requestPermission}
            accessibilityRole="button"
            accessibilityLabel="Browse nearby locations"
            accessibilityHint="Requests location sharing to provide suggestions"
          >
            <Text
              style={[
                styles.browseOptionTitle,
                { color: theme.colors.bodyLight },
              ]}
            >
              Browse nearby locations
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: theme.spacing.regular,
    paddingRight: theme.spacing.regular,
  },

  title: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.header2,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
    marginBottom: theme.spacing.regular,
  },

  optionGroup: {
    gap: theme.spacing.regular,
  },
  searchOptionCard: {
    borderRadius: 100,
    padding: theme.spacing.small,
    borderWidth: 1,
    alignItems: "center",
    alignSelf: "center",
    width: "85%",
  },
  chatOptionCard: {
    borderRadius: theme.radius,
    padding: theme.spacing.small,
    alignItems: "center",
    alignSelf: "center",
    width: "85%",
  },
  browseOptionCard: {
    borderRadius: 100,
    padding: theme.spacing.small,
    alignItems: "center",
    alignSelf: "center",
    width: "75%",
  },
  searchOptionTitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
  },
  chatOptionTitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
  },
  browseOptionTitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
  },
  curLoc: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.body,
    marginBottom: theme.spacing.small,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  loc: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
    paddingVertical: 5,
    width: "80%",
  },
  separator: {
    height: 1,
  },
});

export default HomeScreen;
