// src/navigation/MainTabNavigator.js
import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import HomeScreen from "../screens/HomeScreen";
import HomeStackNavigator from "./HomeStackNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import Header from "../components/Header";
import { theme } from "../styles/themes";
import { useTheme } from "../contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      {/* Consistent header across all tabs */}
      <Header />

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
          options={{
            tabBarLabel: "Search",
            tabBarIcon: ({ focused, color, size }) => {
              // Switch icon based on focus
              const iconName = focused ? "search" : "search-outline";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          }}
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