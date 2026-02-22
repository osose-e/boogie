import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AppStatusBar from './src/components/AppStatusBar';
import { useFonts } from "expo-font";
import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/contexts/ThemeContext";

// import HomeScreen from './src/screens/HomeScreen';
// import VoiceInputScreen from './src/screens/VoiceInputScreen';
// import RideRegistrationScreen from './src/screens/RideRegistrationScreen';
// import RideConfirmationScreen from './src/screens/RideConfirmationScreen';


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
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppStatusBar />
          {/* <StatusBar style="auto" /> */}
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
