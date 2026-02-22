// src/components/Header.js
import React from "react";
import { View, Text } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import GradientText from "./GradientText";
import { theme } from "../styles/themes";
import { useTheme } from "../contexts/ThemeContext";

export default function Header() {
  const insets = useSafeAreaInsets(); // dynamic safe area values
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        // flex: 0.1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          paddingLeft: theme.spacing.regular,
          alignItems: "flex-start",
        }}
      >
        <GradientText
          text="boogie"
          colors={["#09A6B8", "#8A38F5", "#D32EC8", "#ACE347"]}
          style={{
            fontSize: theme.fontSizes.xxl,
            fontFamily: theme.fonts.wordmark,
            zIndex: 2,
          }}
        />
      </View>
    </SafeAreaView>
  );
}