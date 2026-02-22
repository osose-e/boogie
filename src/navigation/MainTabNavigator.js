// src/navigation/MainTabNavigator.js
import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import HomeScreen from "../screens/HomeScreen";
import HomeStackNavigator from "./HomeStackNavigator";
import VoiceInputScreen from "../screens/VoiceInputScreen";
import Header from "../components/Header";
import { theme } from "../styles/themes";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <View style={{ flex: 1 }}>
      {/* Consistent header across all tabs */}
      <Header />

      {/* Tabs */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false, // hide stack headers inside tabs
          tabBarActiveTintColor: theme.colors.light.icons,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{
            tabBarIcon: ({ focused, color, size }) => {
              // Switch icon based on focus
              const iconName = focused ? "home" : "home-outline";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          }}
        />
        <Tab.Screen name="Voice Input" component={VoiceInputScreen} />
      </Tab.Navigator>
    </View>
  );
}