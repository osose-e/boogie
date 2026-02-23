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
// import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

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
        {/* <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: "Search",
            tabBarIcon: ({ focused, color, size }) => {
              const iconName = focused ? "search" : "search-outline";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          }}
        /> */}
        {/* {({ route }) => {
            // Get the name of the active screen in HomeStack
            const routeName = getFocusedRouteNameFromRoute(route) ?? "HomeMain";

            // Only show global header on the main screen
            const showHeader = routeName === "HomeMain";

            return (
              <View style={{ flex: 1 }}>
                {showHeader && <Header />}
                <HomeStackNavigator />
              </View>
            );
          }} */}
        {/* </Tab.Screen> */}

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