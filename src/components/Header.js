// src/components/Header.js
import React from "react";
import { View, Text } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import GradientText from "./GradientText";
import { theme } from "../styles/themes";

export default function Header() {
  const insets = useSafeAreaInsets(); // dynamic safe area values

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        backgroundColor: theme.colors.light.background,
        borderColor: "red",
        // borderWidth: 1,
      }}
    >
      <View
        style={{
          //   paddingTop: insets.top, // ensures text is below status bar/notch
          //   paddingBottom: 16,
          //   height: "20%",
          paddingLeft: 24,
          alignItems: "flex-start",
          //   justifyContent: "center",
          //   alignContent: "center",
          //   justifyContent: "center",
          borderColor: "blue",
          //   borderWidth: 1,
          //   borderBottomWidth: 1,
          //   borderBottomColor: theme.colors.light.borderDark,
        }}
      >
        <GradientText
          text="boogie"
          colors={[
            theme.colors.light.wordmark.primary,
            theme.colors.light.wordmark.secondary,
            theme.colors.light.wordmark.tertiary,
            theme.colors.light.wordmark.quaternary,
          ]}
          style={{ fontSize: theme.fontSizes.xxl, fontFamily: theme.fonts.wordmark }}
        />
      </View>
    </SafeAreaView>
  );
}