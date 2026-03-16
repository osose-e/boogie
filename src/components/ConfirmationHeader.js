import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientText from "./GradientText";
import { theme } from "../styles/themes";

const ConfirmationHeader = () => {

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
          justifyContent: "center",
          paddingHorizontal: theme.spacing.regular,
          height: 56,
          //   marginBottom: theme.spacing.regular,
        }}
      >
        <View
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
      </View>
    </SafeAreaView>
  );
};

export default ConfirmationHeader;