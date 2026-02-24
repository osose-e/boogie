import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { lightColors } from '../styles/colors';

const RideConfirmationScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const {
    pickupLocation = '518 Memorial Way, Stanford, CA 94305',
    dropoffLocation = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
    dropoffLocationName,
    dropoffEntranceDescriptor,
    pickupDate = 'Feb 15 (Today), 2026',
    pickupTime = '21:15',
    needsWheelchair = true,
  } = route.params || {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.logo, { color: colors.text }]} accessibilityRole="text">
          boogie
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.confirmationContainer}>
          <Text style={[styles.confirmationTitle, { color: colors.text }]} accessibilityRole="header">
            Your ride is booked!
          </Text>

          <View style={[styles.detailsContainer, { backgroundColor: colors.backgroundLight }]} accessible={true}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]} accessibilityRole="text">
                Pickup Date & Time:
              </Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]} accessibilityRole="text">
                {pickupDate} @ {pickupTime}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]} accessibilityRole="text">
                Pickup Location:
              </Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]} accessibilityRole="text">
                {pickupLocation}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]} accessibilityRole="text">
                Dropoff:
              </Text>
              <View style={styles.dropoffBlock}>
                {dropoffLocationName && (
                  <Text style={[styles.dropoffName, { color: colors.text }]}>{dropoffLocationName}</Text>
                )}
                {dropoffEntranceDescriptor && (
                  <Text style={[styles.dropoffEntrance, { color: colors.textSecondary }]}>
                    {dropoffEntranceDescriptor}
                  </Text>
                )}
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {dropoffLocation}
                </Text>
              </View>
            </View>

            {needsWheelchair && (
              <View style={[styles.wheelchairContainer, { borderTopColor: colors.border }]}>
                <Text style={styles.wheelchairIcon} accessibilityRole="text">
                  ♿
                </Text>
                <Text style={[styles.wheelchairText, { color: colors.text }]} accessibilityRole="text">
                  You have noted need for a wheelchair.
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Home')}
          accessibilityRole="button"
          accessibilityLabel="Go to home"
        >
          <Text style={[styles.actionButtonText, { color: colors.secondary }]}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const c = lightColors;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    alignItems: 'center',
  },
  logo: { fontSize: 24, fontWeight: '600', color: c.text },
  content: { flex: 1, padding: 20, justifyContent: 'space-between' },
  confirmationContainer: { flex: 1, justifyContent: 'center' },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: c.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  detailsContainer: { backgroundColor: c.backgroundLight, borderRadius: 12, padding: 20 },
  detailRow: { marginBottom: 20 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 6 },
  detailValue: { fontSize: 16, color: c.textSecondary, lineHeight: 24 },
  dropoffBlock: { marginTop: 4 },
  dropoffName: { fontSize: 18, fontWeight: '600', color: c.text, marginBottom: 4 },
  dropoffEntrance: { fontSize: 15, color: c.textSecondary, fontStyle: 'italic', marginBottom: 4 },
  dropoffAddress: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  wheelchairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  wheelchairIcon: { fontSize: 24, marginRight: 8 },
  wheelchairText: { fontSize: 16, color: c.text, fontWeight: '500' },
  actionButton: {
    backgroundColor: c.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: { color: c.secondary, fontSize: 18, fontWeight: '600' },
});

export default RideConfirmationScreen;
