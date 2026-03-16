// src/components/StackHeader.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { AccessibilityInfo, findNodeHandle } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const StackHeader = React.forwardRef(({ title, onBack }, ref) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [headerFocused, setHeaderFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref?.current) {
        AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref.current));
        setHeaderFocused(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          height: 56,
          marginHorizontal: theme.spacing.sm,
          // marginBottom: theme.spacing.regular,
        }}
      >
        <TouchableOpacity
          onPress={() => (onBack ? onBack() : navigation.goBack())}
          style={{ position: "absolute", left: 0 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          importantForAccessibility={
            headerFocused ? "auto" : "no-hide-descendants"
          }
          accessibilityElementsHidden={!headerFocused}
        >
          <Ionicons
            name="chevron-back-outline"
            size="40"
            color={theme.colors.backButton}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: theme.fontSizes.xl,
            fontFamily: theme.fonts.header1,
            color: theme.colors.header1,
          }}
          ref={ref}
          accessibilityRole="header"
          accessibilityLabel={title}
        >
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
});

export default StackHeader;