import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmationHeader from '../components/ConfirmationHeader';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from "@expo/vector-icons";

const RideConfirmationScreen = ({ navigation, route }) => {
  const {
    pickupLocationName = '518 Memorial Way, Stanford, CA 94305',
    dropoffLocationName = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
    pickupDate = 'Feb 15 (Today), 2026',
    pickupTime = '21:15',
    needsWheelchair = true,
  } = route.params || {};
  const { theme, themeMode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar style={themeMode === "light" ? "dark" : "light"} />
      <ConfirmationHeader />

      <View style={styles.content}>
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationTitle} accessibilityRole="header">
            Your ride is booked!
          </Text>

          <View style={styles.detailsContainer} accessible={true}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.body }]} accessibilityRole="text">
                Pickup Date & Time:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.body }]} accessibilityRole="text">
                {pickupDate} @ {pickupTime}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.body }]} accessibilityRole="text">
                Pickup Location:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.body }]} accessibilityRole="text">
                {pickupLocationName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.body }]} accessibilityRole="text">
                Dropoff Location:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.body }]} accessibilityRole="text">
                {dropoffLocationName}
              </Text>
            </View>

            {needsWheelchair && (
              <View style={[styles.wheelchairContainer, {borderTopColor: theme.colors.border}]}>
                <Text style={styles.wheelchairIcon} accessibilityRole="text">
                  ♿
                </Text>
                <Text style={[styles.wheelchairText, {color: theme.colors.body}]} accessibilityRole="text">
                  You have noted need for a wheelchair.
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // In a real app, this would navigate to "My Rides" screen
            navigation.navigate("Home");
          }}
          accessibilityRole="button"
          accessibilityLabel="Go to My Rides"
        >
          <Text style={[styles.actionButtonText, {color: theme.colors.background}]}>Go to My Rides →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: "center",
  },
  confirmationTitle: {
    fontSize: 28,
    fontFamily: theme.fonts.header1,
    color: theme.colors.light.primary,
    marginBottom: 32,
    textAlign: "center",
  },
  detailsContainer: {
    borderRadius: 12,
    padding: 20,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    lineHeight: 24,
  },
  wheelchairContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  wheelchairIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  wheelchairText: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: theme.colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 20,
  },
  actionButtonText: {
    fontSize: 18,
    fontFamily: theme.fonts.header3,
  },
});

export default RideConfirmationScreen;
