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
import { theme } from '../styles/themes';
import { useTheme } from "../contexts/ThemeContext";
import { colors } from '../styles/colors';
import MainHeader from '../components/MainHeader';
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={goToSearch}
            accessibilityRole="button"
            accessibilityLabel="Search locations"
            accessibilityHint="Opens a search screen with a list of locations"
          >
            <Text style={[styles.optionTitle, { color: theme.colors.body }]}>
              Search locations
            </Text>
            <Text style={[styles.optionDescription, {color: theme.colors.body}]}>
              Find locations by name and entrance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // style={styles.optionCard}
            onPress={goToVoice}
            accessibilityRole="button"
            accessibilityLabel="Chat with BoogieBot"
            accessibilityHint="Opens a chatbot assistant to choose your destination"
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      ></ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    borderColor: "red",
    // borderWidth: 1,
  },
  content: { flex: 1, padding: theme.spacing.regular },
  contentContainer: { padding: 20 },
  title: {
    fontSize: theme.fontSizes.header2,
    fontFamily: theme.fonts.header2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.body,
    marginBottom: 16,
  },
  optionGroup: { gap: theme.spacing.regular },
  optionCard: {
    borderRadius: 100,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  optionTitle: {
    fontSize: theme.fontSizes.header3,
    fontFamily: theme.fonts.header2,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: { fontSize: 14, color: colors.textSecondary },
});

export default HomeScreen;