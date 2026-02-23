// src/navigation/MainTabNavigator.js
import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import HomeScreen from "../screens/HomeScreen";
import HomeStackNavigator from "./HomeStackNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import Header from "../components/TabHeader";
// import { theme } from "../styles/themes";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
// import Ionicons from "react-native-vector-icons/Ionicons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false, // hide stack headers inside tabs
          tabBarActiveTintColor: theme.colors.icons,
          tabBarStyle: {
            backgroundColor: theme.colors.background, // Tab bar background
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={({ route }) => {
            // Get the currently active screen inside the stack
            const routeName = getFocusedRouteNameFromRoute(route) ?? "HomeMain";

            // Hide tab bar on "VoiceInput" screen
            const hideTabBar = routeName === "VoiceInput";

            return {
              tabBarLabel: "Search",
              tabBarStyle: hideTabBar ? { display: "none" } : undefined,
              tabBarIcon: ({ focused, color, size }) => {
                const iconName = focused ? "search" : "search-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            };
          }}
          //   options={{
          //     tabBarLabel: "Search",
          //     tabBarIcon: ({ focused, color, size }) => {
          //       // Switch icon based on focus
          //       const iconName = focused ? "search" : "search-outline";
          //       return <Ionicons name={iconName} size={size} color={color} />;
          //     },
          //   }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => {
              // Switch icon based on focus
              const iconName = focused
                ? "person-circle"
                : "person-circle-outline";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          }}
        />
      </Tab.Navigator>
    </View>
  );
}