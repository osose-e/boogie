import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AppStatusBar from './src/components/AppStatusBar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import VoiceInputScreen from './src/screens/VoiceInputScreen';
import RideRegistrationScreen from './src/screens/RideRegistrationScreen';
import RideConfirmationScreen from './src/screens/RideConfirmationScreen';

const Stack = createStackNavigator();

function AppContent() {
  const { navTheme } = useTheme();

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="auto" />
      <AppStatusBar />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="VoiceInput" component={VoiceInputScreen} />
        <Stack.Screen name="RideRegistration" component={RideRegistrationScreen} />
        <Stack.Screen name="RideConfirmation" component={RideConfirmationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
