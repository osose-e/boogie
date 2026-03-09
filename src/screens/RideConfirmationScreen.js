import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../styles/colors';
import RideBookingProgressBar from '../components/RideBookingProgressBar';

const RideConfirmationScreen = ({ navigation, route }) => {
  const {
    pickupLocationName = '518 Memorial Way, Stanford, CA 94305',
    dropoffLocationName = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
    pickupDate = 'Feb 15 (Today), 2026',
    pickupTime = '21:15',
    needsWheelchair = true,
  } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo} accessibilityRole="text">
          boogie
        </Text>
      </View>

      <RideBookingProgressBar completedSteps={3} />

      <View style={styles.content}>
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationTitle} accessibilityRole="header">
            Your ride is booked!
          </Text>

          <View style={styles.detailsContainer} accessible={true}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} accessibilityRole="text">
                Pickup Date & Time:
              </Text>
              <Text style={styles.detailValue} accessibilityRole="text">
                {pickupDate} @ {pickupTime}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} accessibilityRole="text">
                Pickup Location:
              </Text>
              <Text style={styles.detailValue} accessibilityRole="text">
                {pickupLocationName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} accessibilityRole="text">
                Dropoff Location:
              </Text>
              <Text style={styles.detailValue} accessibilityRole="text">
                {dropoffLocationName}
              </Text>
            </View>

            {needsWheelchair && (
              <View style={styles.wheelchairContainer}>
                <Text style={styles.wheelchairIcon} accessibilityRole="text">
                  ♿
                </Text>
                <Text style={styles.wheelchairText} accessibilityRole="text">
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
            navigation.navigate('Home');
          }}
          accessibilityRole="button"
          accessibilityLabel="Go to My Rides"
        >
          <Text style={styles.actionButtonText}>Go to My Rides →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 20,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  dropoffBlock: {
    marginTop: 4,
  },
  dropoffName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dropoffEntrance: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  dropoffAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  wheelchairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  wheelchairIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  wheelchairText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: colors.text,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RideConfirmationScreen;
