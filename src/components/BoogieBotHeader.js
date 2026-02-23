// src/components/Header.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function BoogieBotHeader() {
  const insets = useSafeAreaInsets(); // dynamic safe area values
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView
      edges={["top"]}
      // style={{
      //   // flex: 0.1,
      //   // backgroundColor: theme.colors.background,
      // }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          height: 56,
          marginBottom: theme.spacing.regular,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ position: "absolute", left: 0 }}
          accessibilityRole="button"
          accessibilityLabel="Back to home screen"
        >
          <Ionicons
            name="chevron-back-outline"
            size="40"
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: theme.fontSizes.xxl,
            fontFamily: theme.fonts.wordmark,
            color: "#FFFFFF",
          }}
          accessibilityRole="header"
          accessibilityLabel="BoogieBot"
        >
          BoogieBot
        </Text>
      </View>
    </SafeAreaView>
  );
}