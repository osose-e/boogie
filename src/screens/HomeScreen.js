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
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { useTheme } from '../contexts/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const logoRef = useRef(null);
  const { themeMode, toggleTheme, theme } = useTheme();

  // When app first opens, this is the initial screen — focus Boogie header after layout
  React.useEffect(() => {
    const t = setTimeout(() => {
      const node = findNodeHandle(logoRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // When navigating back to Home, focus Boogie header again
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        const node = findNodeHandle(logoRef.current);
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
  const goToSearch = () => navigation.navigate('Search');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          ref={logoRef}
          style={[styles.logo, { color: theme.colors.text }]}
          accessibilityRole="text"
          accessible={true}
          importantForAccessibility="yes"
          accessibilityLabel="Boogie app"
        >
          boogie
        </Text>
        <Button
          title={`Switch to ${themeMode === "light" ? "Dark" : "Light"} Mode`}
          onPress={toggleTheme}
          color={theme.colors.primary}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          accessibilityRole="header"
        >
          Book a ride
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          accessibilityRole="text"
        >
          Select one of the options below.
        </Text>

        <View style={styles.optionGroup}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundLight,
              },
            ]}
            onPress={goToSearch}
            accessibilityRole="button"
            accessibilityLabel="Search locations"
            accessibilityHint="Opens a search screen with a list of locations"
          >
            <Text style={styles.optionTitle}>Search locations</Text>
            <Text style={styles.optionDescription}>
              Type a name and choose from a list.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundLight,
              },
            ]}
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  logo: { fontSize: 24, fontWeight: '600' },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },

  optionGroup: { gap: 12 },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  optionDescription: { fontSize: 14, color: colors.textSecondary },
});

export default HomeScreen;
