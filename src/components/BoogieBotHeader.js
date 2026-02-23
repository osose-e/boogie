// src/components/Header.js

import React, { forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
  findNodeHandle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";

const BoogieBotHeader = forwardRef((props, ref) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top"]}>
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
          importantForAccessibility="no-hide-descendants" // temporarily ignored
        >
          <Ionicons name="chevron-back-outline" size={40} color="#FFFFFF" />
        </TouchableOpacity>

        <Text
          ref={ref} // now the parent ref is correctly attached
          accessibilityRole="header"
          accessibilityLabel="BoogieBot"
          style={{
            fontSize: theme.fontSizes.xxl,
            fontFamily: theme.fonts.wordmark,
            color: "#FFFFFF",
          }}
        >
          BoogieBot
        </Text>
      </View>
    </SafeAreaView>
  );
});

export default BoogieBotHeader;






// import React, { forwardRef } from "react";
// import { View, Text, TouchableOpacity, AccessibilityInfo, findNodeHandle } from "react-native";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";
// import { useTheme } from "../contexts/ThemeContext";
// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";

// export default function BoogieBotHeader({ ref }) {
//   const insets = useSafeAreaInsets(); // dynamic safe area values
//   const { theme } = useTheme();
//   const navigation = useNavigation();

//   return (
//     <SafeAreaView
//       edges={["top"]}
//     >
//       <View
//         style={{
//           flexDirection: "row",
//           justifyContent: "center",
//           alignItems: "center",
//           height: 56,
//           marginBottom: theme.spacing.regular,
//         }}
//       >
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           style={{ position: "absolute", left: 0 }}
//           accessibilityRole="button"
//           accessibilityLabel="Back to home screen"
//         >
//           <Ionicons
//             name="chevron-back-outline"
//             size="40"
//             color="#FFFFFF"
//           />
//         </TouchableOpacity>

//         <Text
//           style={{
//             fontSize: theme.fontSizes.xxl,
//             fontFamily: theme.fonts.wordmark,
//             color: "#FFFFFF",
//           }}
//           ref={ref}
//           accessibilityRole="header"
//           accessibilityLabel="BoogieBot"
//         >
//           BoogieBot
//         </Text>
//       </View>
//     </SafeAreaView>
//   );
// }