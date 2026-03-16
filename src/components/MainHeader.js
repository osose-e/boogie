// src/components/Header.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientText from "./GradientText";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const MainHeader = ({ headerRef }) => {
  const { themeMode, toggleTheme, theme } = useTheme();

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{
        // flex: 0.1,
        backgroundColor: theme.colors.background,
        // borderColor: "red",
        // borderWidth: 1
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.regular,
          height: 56,
          //   marginBottom: theme.spacing.regular,
        }}
      >
        <View
          ref={headerRef}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Boogie"
        >
          <GradientText
            text="boogie"
            colors={["#09A6B8", "#8A38F5", "#D32EC8", "#ACE347"]}
            style={{
              fontSize: theme.fontSizes.wordmark,
              fontFamily: theme.fonts.wordmark,
              zIndex: 2,
            }}
          />
        </View>

        {/* MODE TOGGLE BUTTON */}
        <TouchableOpacity
          onPress={toggleTheme}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            themeMode === "light"
              ? "Switch to dark mode"
              : "Switch to light mode"
          }
          accessibilityHint="Changes the app color mode"
          style={{
            padding: 5,
            borderColor: theme.colors.modeToggle,
            borderWidth: 2,
            borderRadius: 100,
            marginTop: 2,
          }}
        >
          <Ionicons
            name={themeMode === "light" ? "moon" : "sunny"}
            size={30}
            color={theme.colors.modeToggle}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MainHeader;