import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import VoiceInputScreen from "../screens/VoiceInputScreen";
import RideRegistrationScreen from "../screens/RideRegistrationScreen";
import RideConfirmationScreen from "../screens/RideConfirmationScreen";
import SearchScreen from "../screens/SearchScreen";
import EntranceSelectScreen from "../screens/EntranceSelectScreen";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="VoiceInput" component={VoiceInputScreen} />
      <Stack.Screen
        name="RideRegistration"
        component={RideRegistrationScreen}
      />
      <Stack.Screen
        name="RideConfirmation"
        component={RideConfirmationScreen}
      />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen
        name="PickupEntranceSelect"
        component={EntranceSelectScreen}
      />
      <Stack.Screen
        name="DropoffEntranceSelect"
        component={EntranceSelectScreen}
      />
      <Stack.Screen name="PickupSearch" component={SearchScreen} />
      <Stack.Screen name="DropoffSearch" component={SearchScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;