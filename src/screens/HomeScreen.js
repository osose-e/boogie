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
import { theme } from '../styles/themes';
import { useTheme } from "../contexts/ThemeContext";
import { colors } from '../styles/colors';
import MainHeader from '../components/MainHeader';

const HomeScreen = ({ navigation }) => {
  const headerRef = useRef(null);

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
  const goToSearch = () => navigation.navigate('Search');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <MainHeader headerRef={headerRef} />

      <View style={styles.content}>
        <Text
          style={[styles.title, { color: theme.colors.header2 }]}
          accessibilityRole="header"
        >
          Book your next ride
        </Text>
        <Text style={styles.subtitle} accessibilityRole="text">
          Select one of the options below.
        </Text>

        <View style={styles.optionGroup}>
          <TouchableOpacity
            style={styles.optionCard}
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
    color: colors.textSecondary,
    marginBottom: 16,
  },

  optionGroup: { gap: 12 },
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
  optionDescription: { fontSize: 14, color: colors.textSecondary },
});

export default HomeScreen;