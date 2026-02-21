import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from "expo-font";
import HomeScreen from './src/screens/HomeScreen';
import VoiceInputScreen from './src/screens/VoiceInputScreen';
import RideRegistrationScreen from './src/screens/RideRegistrationScreen';
import RideConfirmationScreen from './src/screens/RideConfirmationScreen';

const Stack = createStackNavigator();

export default function App() {
  // console.log(require("./assets/fonts/AlbertSans-Regular.ttf"));
  const [fontsLoaded] = useFonts({
    "AlbertSans-Regular": require("./assets/fonts/AlbertSans-Regular.ttf"),
    "AlbertSans-Bold": require("./assets/fonts/AlbertSans-Bold.ttf"),
    "AlbertSans-Italic": require("./assets/fonts/AlbertSans-Italic.ttf"),
    "BagelFatOne-Regular": require("./assets/fonts/BagelFatOne-Regular.ttf")
  });

  if (!fontsLoaded) {
    return null;
  }

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
