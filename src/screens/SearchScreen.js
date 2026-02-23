import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import HomeStackHeader from '../components/HomeStackHeader';

const SearchScreen = ({ navigation }) => {
    const { theme } = useTheme();

//   const goToSearch = () => navigation.navigate("Search");
//   const goToVoice = () => navigation.navigate('VoiceInput');

  return (
    <SafeAreaView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          edges={["left", "right"]}
        >
        <HomeStackHeader title="Search"/>
      <Text style={{ color: theme.colors.bodyDark }}>Search Screen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: theme.spacing.regular,
    paddingRight: theme.spacing.regular,
  },
});

export default SearchScreen;