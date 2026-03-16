import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from "expo-font";
import RootNavigator from './src/navigation/RootNavigator';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { useTheme } from "./src/contexts/ThemeContext";


function AppContent() {
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={theme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "AlbertSans-Regular": require("./assets/fonts/AlbertSans-Regular.ttf"),
    "AlbertSans-Bold": require("./assets/fonts/AlbertSans-Bold.ttf"),
    "AlbertSans-Italic": require("./assets/fonts/AlbertSans-Italic.ttf"),
    "BagelFatOne": require("./assets/fonts/BagelFatOne-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
