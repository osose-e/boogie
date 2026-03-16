import React, { forwardRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import GradientText from "./GradientText";

const BoogieBotHeader = forwardRef((props, ref) => {
  const { theme } = useTheme();
  const navigation = useNavigation();


  return (
    <SafeAreaView edges={["left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: 56,
          paddingHorizontal: theme.spacing.regular,
        }}
      >
        {/* Back button FIRST */}
        <TouchableOpacity
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Back to home screen"
        >
        <Ionicons
            name="chevron-back-outline"
            size={40}
            color={theme.colors.backButton}
        />
        </TouchableOpacity>

        {/* Title SECOND */}
        <View
        ref={ref}
        pointerEvents="none"
        // style={{
        //     position: "absolute",
        //     left: 0,
        //     right: 0,
        //     alignItems: "center",
        // }}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="BoogieBot"
        >
          <GradientText
            text="BoogieBot"
            colors={["#09A6B8", "#8A38F5", "#D32EC8", "#ACE347"]}
            style={{
            fontSize: theme.fontSizes.wordmark,
            fontFamily: theme.fonts.wordmark,
            }}
          />
        </View>
        <View style={{width: 40}}/>
      </View>
    </SafeAreaView>
  );
});

export default BoogieBotHeader;