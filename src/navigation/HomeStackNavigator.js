import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import VoiceInputScreen from "../screens/VoiceInputScreen";
import RideRegistrationScreen from "../screens/RideRegistrationScreen";
import RideConfirmationScreen from "../screens/RideConfirmationScreen";

const Stack = createStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "Search" }}
      />
      <Stack.Screen
        name="VoiceInput"
        component={VoiceInputScreen}
        options={{ title: "VoiceInput", tabBarStyle: { display: "none" } }}
      />
      <Stack.Screen
        name="RideRegistration"
        component={RideRegistrationScreen}
        options={{ title: "RideRegistration", tabBarStyle: { display: "none" } }}
      />
      <Stack.Screen
        name="RideConfirmation"
        component={RideConfirmationScreen}
        options={{ title: "RideConfirmation" }}
      />
    </Stack.Navigator>
  );
}