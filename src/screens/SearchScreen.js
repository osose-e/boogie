import React, { useState }from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
import HomeStackHeader from '../components/HomeStackHeader';

const SearchScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [text, setText] = useState("");

    const handlePress = () => {
      alert(`You typed: ${text}`);
    };

//   const goToSearch = () => navigation.navigate("Search");
//   const goToVoice = () => navigation.navigate('VoiceInput');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right"]}
    >
      <HomeStackHeader title="Search" />
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.borderColored,
            color: theme.colors.bodyDark,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.colors.bodyDark }]}
          placeholder="Find locations by name"
          placeholderTextColor={theme.colors.textPlaceholder}
          value={text}
          onChangeText={setText} // updates the state as user types
        />
        <TouchableOpacity style={{ justifyContent: "center" }}>
          <Ionicons
            name="search-outline"
            size="36"
            color={theme.colors.icons}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: theme.spacing.regular,
    paddingRight: theme.spacing.regular,
  },
  inputWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 45,
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: theme.spacing.small,
  },
  input: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
  },
});

export default SearchScreen;