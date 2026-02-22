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
import { theme } from '../styles/themes';

const SearchScreen = ({ navigation }) => {

  const goToSearch = () => navigation.navigate("Search");
  const goToVoice = () => navigation.navigate('VoiceInput');

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Search Screen</Text>
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

export default SearchScreen;