import React, { useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";
import { theme } from "../styles/themes";
import { useTheme } from "../contexts/ThemeContext";
import MainHeader from "../components/MainHeader";
import { LinearGradient } from "expo-linear-gradient";

const HomeScreen = ({ navigation }) => {
  const headerRef = useRef(null);
  const { theme, themeMode } = useTheme();

  // When app first opens, this is the initial screen — focus Boogie header after layout
  React.useEffect(() => {
    const t = setTimeout(() => {
      const node = findNodeHandle(headerRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // When navigating back to Home, focus Boogie header again
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        const node = findNodeHandle(headerRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 400);
      return () => clearTimeout(t);
    }, [])
  );

  React.useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Keyboard.dismiss();
    });
    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const goToVoice = () => navigation.navigate('VoiceInput');
  const goToSearch = () => navigation.navigate('PickupSearch');

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundColor },
      ]}
    >
      <StatusBar style={themeMode === "light" ? "dark" : "light"} />
      <MainHeader headerRef={headerRef} />

      <View style={styles.content}>
        <Text
          style={[styles.title, { color: theme.colors.header2 }]}
          accessibilityRole="header"
        >
          Book your next ride
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.body }]}
          accessibilityRole="text"
        >
          Select one of the options below:
        </Text>

        <View style={styles.optionGroup}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                borderWidth: 1,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={goToSearch}
            accessibilityRole="button"
            accessibilityLabel="Search locations"
            accessibilityHint="Opens a search screen with a list of locations"
          >
            <Text style={[styles.optionTitle, { color: theme.colors.header3 }]}>
              Search locations
            </Text>
            <Text
              style={[styles.optionDescription, { color: theme.colors.body }]}
            >
              Find locations by name and entrance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToVoice}
            accessibilityRole="button"
            accessibilityLabel="Use digital chatbot dispatcher"
            accessibilityHint="Opens a chatbot conversation to help you quickly book a ride"
          >
            <LinearGradient
              colors={["#09A6B8", "#8A38F5", "#D32EC8", "#ACE347"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.optionCard}
            >
              <Text style={[styles.optionTitle, { color: "#FFFFFF" }]}>
                Chat with BoogieBot
              </Text>
              <Text style={[styles.optionDescription, { color: "#FFFFFF" }]}>
                Set up your ride with a chatbot assistant
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  title: {
    fontSize: 22,
    fontFamily: theme.fonts.header2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    marginBottom: 16,
  },

  optionGroup: { gap: theme.spacing.lg },
  optionCard: {
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.header3,
    marginBottom: 6,
  },
  optionDescription: { fontSize: 14, fontFamily: theme.fonts.body },
});

export default HomeScreen;
