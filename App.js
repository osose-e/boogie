import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import VoiceInputScreen from './src/screens/VoiceInputScreen';
import RideRegistrationScreen from './src/screens/RideRegistrationScreen';
import RideConfirmationScreen from './src/screens/RideConfirmationScreen';
import SearchScreen from './src/screens/SearchScreen';
import EntranceSelectScreen from './src/screens/EntranceSelectScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="VoiceInput" component={VoiceInputScreen} />
        <Stack.Screen name="RideRegistration" component={RideRegistrationScreen} />
        <Stack.Screen name="RideConfirmation" component={RideConfirmationScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="PickupEntranceSelect" component={EntranceSelectScreen} />
        <Stack.Screen name="DropoffEntranceSelect" component={EntranceSelectScreen} />
        <Stack.Screen name="PickupSearch" component={SearchScreen} />
        <Stack.Screen name="DropoffSearch" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
