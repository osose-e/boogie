import React, { useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { colors } from '../styles/colors';

const HomeScreen = ({ navigation }) => {
  const logoRef = useRef(null);

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
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text
          ref={logoRef}
          style={styles.logo}
          accessibilityRole="text"
          accessible={true}
          importantForAccessibility="yes"
          accessibilityLabel="Boogie app"
        >
          boogie
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <Text style={styles.title} accessibilityRole="header">
          Book a ride
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 24, fontWeight: '600', color: colors.text },

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
