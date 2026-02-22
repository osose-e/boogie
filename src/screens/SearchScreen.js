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

const SearchScreen = ({ navigation }) => {

//   const goToSearch = () => navigation.navigate("Search");
//   const goToVoice = () => navigation.navigate('VoiceInput');

  return (
    <SafeAreaView style={styles.container}>
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
});

export default SearchScreen;