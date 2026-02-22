import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/themes';

const HomeScreen = ({ navigation }) => {
  // const logoRef = useRef(null);

  // // Focus on logo when screen loads
  // useEffect(() => {
  //   const raf = requestAnimationFrame(() => {
  //     const node = findNodeHandle(logoRef.current);
  //     if (node) {
  //       AccessibilityInfo.setAccessibilityFocus(node);
  //     }
  //   });
  //   return () => cancelAnimationFrame(raf);
  // }, []);

  const goToSearch = () => navigation.navigate("Search");
  const goToVoice = () => navigation.navigate('VoiceInput');

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Text style={styles.title} accessibilityRole="header">
        Find your drop-off location
      </Text>
      <Text style={styles.subtitle} accessibilityRole="text">
        Select one of the options below:
      </Text>

      <View style={styles.optionGroup}>
        <TouchableOpacity
          style={styles.searchOptionCard}
          onPress={goToSearch}
          accessibilityRole="button"
          accessibilityLabel="Search destinations"
          accessibilityHint="Opens a new page with a search field and list of locations"
        >
          <Text style={styles.searchOptionTitle}>Search for a destination</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToVoice}
          accessibilityRole="button"
          accessibilityLabel="Use voice assistant"
          accessibilityHint="Opens a voice assistant to choose your destination"
        >
          <LinearGradient
            colors={[
              theme.colors.light.wordmark.primary,
              theme.colors.light.wordmark.secondary,
              theme.colors.light.wordmark.tertiary,
              theme.colors.light.wordmark.quaternary,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatOptionCard}
          >
            <Text style={styles.chatOptionTitle}>Chat with BoogieBot</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
    paddingLeft: theme.spacing.regular,
    paddingRight: theme.spacing.regular,
  },

  title: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.header2,
    color: theme.colors.light.header2,
    marginBottom: 5,
    marginTop: theme.spacing.regular,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.light.bodyDark,
    marginBottom: theme.spacing.regular,
  },

  optionGroup: {
    gap: theme.spacing.regular,
  },
  searchOptionCard: {
    borderRadius: 100,
    padding: theme.spacing.small,
    borderWidth: 1,
    borderColor: theme.colors.light.borderDark,
    backgroundColor: theme.colors.light.background,
    alignItems: "center",
  },
  chatOptionCard: {
    borderRadius: theme.radius,
    padding: theme.spacing.small,
    backgroundColor: theme.colors.light.background,
    alignItems: "center",
  },
  searchOptionTitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
    color: theme.colors.light.bodyDark,
  },
  chatOptionTitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
    color: theme.colors.light.bodyLight,
  },
});

export default HomeScreen;
