import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
  Button,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from '../styles/themes';
import { useTheme } from "../contexts/ThemeContext";
import Header from '../components/TabHeader';

const ProfileScreen = ({ navigation }) => {
    const { themeMode, toggleTheme, theme } = useTheme();

//   const goToSearch = () => navigation.navigate("Search");
//   const goToVoice = () => navigation.navigate('VoiceInput');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right"]}
    >
      <Header />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
          padding: theme.spacing.regular,
        }}
      >
        <Button
          title={`Switch to ${themeMode === "light" ? "Dark" : "Light"} Mode`}
          onPress={toggleTheme}
          color={theme.colors.primary} // optional: match your theme
        />

        <Text
          style={{
            color: theme.colors.bodyDark,
            marginTop: theme.spacing.small,
          }}
        >
          Current mode: {themeMode}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingLeft: theme.spacing.regular,
    paddingRight: theme.spacing.regular,
  },
});

export default ProfileScreen;