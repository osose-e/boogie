import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import CancelConfirmationModal from '../components/CancelConfirmationModal';
import FinalizeConfirmationModal from '../components/FinalizeConfirmationModal';
import { theme } from "../styles/themes";
import { useTheme } from '../contexts/ThemeContext';
import HomeStackHeader from '../components/HomeStackHeader';

const RideRegistrationScreen = ({ navigation, route }) => {
  const locationName = "Lathrop Library";
  const locationAddress = "518 Memorial Way, Stanford, CA 94305";
  const {
    pickupLocation = DEFAULT_PICKUP_LOCATION,
    dropoffLocation = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
  } = route.params || {};

  const [pickupTime, setPickupTime] = useState('later'); // 'now' or 'later'
  const [pickupDate, setPickupDate] = useState('Feb 15, 2026');
  const [pickupTimeValue, setPickupTimeValue] = useState('21:15');
  const [notes, setNotes] = useState('');
  const [needsWheelchair, setNeedsWheelchair] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const { theme } = useTheme();

  const handleRequestRide = () => {
    setShowFinalizeModal(true);
  };

  const handleFinalizeBooking = () => {
    setShowFinalizeModal(false);
    const confirmationDate = pickupTime === 'now' 
      ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : pickupDate;
    navigation.navigate('RideConfirmation', {
      pickupLocation,
      dropoffLocation,
      pickupDate: confirmationDate,
      pickupTime: pickupTime === 'now' ? 'Now' : pickupTimeValue,
      needsWheelchair,
    });
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    navigation.navigate('HomeMain');
  };

  const headerTitleRef = useRef(null);

  // Focus on header title when screen loads
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = findNodeHandle(headerTitleRef.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Dismiss keyboard when tapping outside
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Keyboard.dismiss();
    });
    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right"]}
    >
      <HomeStackHeader title="Complete Ride Booking" />

      <ScrollView
        // style={styles.content}
        // contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <Text
          style={[styles.currentLocation, { color: theme.colors.textAddress }]}
          numberOfLines={1}
          ellipsizeMode="tail"
          accessibilityRole="text"
        >
          Current location:{" "}
          <Text style={{ fontFamily: theme.fonts.header2 }}>
            {locationName}
          </Text>
          , {locationAddress}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel} accessibilityRole="text">
            Pick-up Time
          </Text>
          <View style={styles.timeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.timeToggle,
                pickupTime === "now" && styles.timeToggleActive,
              ]}
              onPress={() => setPickupTime("now")}
              accessibilityRole="button"
              accessibilityLabel="Select pickup time: Now"
              accessibilityState={{ selected: pickupTime === "now" }}
            >
              <Text
                style={[
                  styles.timeToggleText,
                  pickupTime === "now" && styles.timeToggleTextActive,
                ]}
              >
                Now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeToggle,
                pickupTime === "later" && styles.timeToggleActive,
              ]}
              onPress={() => setPickupTime("later")}
              accessibilityRole="button"
              accessibilityLabel="Select pickup time: Later"
              accessibilityState={{ selected: pickupTime === "later" }}
            >
              <Text
                style={[
                  styles.timeToggleText,
                  pickupTime === "later" && styles.timeToggleTextActive,
                ]}
              >
                Later
              </Text>
            </TouchableOpacity>
          </View>

          {pickupTime === "later" && (
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeRow}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <View style={styles.dateTimeInputContainer}>
                  <TextInput
                    style={styles.dateTimeInput}
                    value={pickupDate}
                    onChangeText={setPickupDate}
                    accessibilityLabel="Pickup date"
                    accessibilityRole="textbox"
                  />
                  <Text style={styles.editIcon}>✏️</Text>
                </View>
              </View>
              <View style={styles.dateTimeRow}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <View style={styles.dateTimeInputContainer}>
                  <TextInput
                    style={styles.dateTimeInput}
                    value={pickupTimeValue}
                    onChangeText={setPickupTimeValue}
                    placeholder="HH:MM"
                    accessibilityLabel="Pickup time"
                    accessibilityRole="textbox"
                  />
                  <Text style={styles.editIcon}>✏️</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel} accessibilityRole="text">
            Pickup Location
          </Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{locationName}, {locationAddress}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel} accessibilityRole="text">
            Dropoff Location
          </Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{dropoffLocation}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel} accessibilityRole="text">
            Notes
          </Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes for the driver. (Optional, max. 100 char)"
            placeholderTextColor={theme.colors.bodyDark}
            multiline
            maxLength={100}
            accessibilityLabel="Notes for the driver, optional, maximum 100 characters"
            accessibilityRole="textbox"
          />
          <Text style={styles.notesCounter}>{notes.length}/100</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel} accessibilityRole="text">
              Check if you need a wheelchair
            </Text>
            <Switch
              value={needsWheelchair}
              onValueChange={setNeedsWheelchair}
              trackColor={{
                false: theme.colors.borderDark,
                true: theme.colors.wordmark.primary,
              }}
              thumbColor={theme.colors.switchThumb}
              accessibilityRole="switch"
              accessibilityLabel="Wheelchair accessibility needed"
              accessibilityState={{ checked: needsWheelchair }}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel} accessibilityRole="text">
              This is a recurring request
            </Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{
                false: theme.colors.borderDark,
                true: theme.colors.wordmark.primary,
              }}
              thumbColor={theme.colors.switchThumb}
              accessibilityRole="switch"
              accessibilityLabel="Recurring ride request"
              accessibilityState={{ checked: isRecurring }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.buttonSecondary }]}
          onPress={() => setShowCancelModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Cancel booking"
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.buttonTextSecondary }]}>Cancel booking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.buttonPrimary }]}
          onPress={handleRequestRide}
          accessibilityRole="button"
          accessibilityLabel="Request ride"
        >
          <Text style={[styles.requestButtonText, { color: theme.colors.buttonTextPrimary }]}>Request ride</Text>
        </TouchableOpacity>
      </View>

      <CancelConfirmationModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />

      <FinalizeConfirmationModal
        visible={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        onConfirm={handleFinalizeBooking}
        rideDetails={{
          pickupDate:
            pickupTime === "now" ? new Date().toISOString() : pickupDate,
          pickupTime: pickupTime === "now" ? "Now" : pickupTimeValue,
          pickupLocation,
          dropoffLocation,
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: theme.spacing.regular,
    paddingRight: theme.spacing.regular,
  },
  contentContainer: {
    padding: 20,
  },
  currentLocation: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.body,
    marginBottom: theme.spacing.regular,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
    color: theme.colors.light.bodyDark,
    marginBottom: 12,
  },
  timeToggleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    borderColor: "red",
    // borderWidth: 1,
    justifyContent: "space-evenly",
  },
  timeToggle: {
    // flex: 1,
    width: "30%",
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.small,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.light.background,
    borderWidth: 1,
    borderColor: theme.colors.light.borderDark,
    alignItems: "center",
  },
  timeToggleActive: {
    backgroundColor: theme.colors.light.wordmark.primary,
    borderColor: theme.colors.light.wordmark.primary,
  },
  timeToggleText: {
    fontSize: 16,
    color: theme.colors.light.bodyDark,
    fontWeight: "600",
  },
  timeToggleTextActive: {
    color: theme.colors.light.bodyLight,
  },
  dateTimeContainer: {
    gap: 16,
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTimeLabel: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
    color: theme.colors.light.bodyDark,
  },
  dateTimeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateTimeInput: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.light.bodyDark,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.light.background,
    borderRadius: 6,
    minWidth: 120,
  },
  editIcon: {
    fontSize: 16,
  },
  locationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.light.background,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.light.bodyDark,
  },
  notesInput: {
    backgroundColor: theme.colors.light.background,
    borderColor: theme.colors.light.borderDark,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.light.bodyDark,
    minHeight: 80,
    textAlignVertical: "top",
  },
  notesCounter: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
    color: theme.colors.light.bodyDark,
    textAlign: "right",
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderColor: "red",
    borderWidth: 1,
    // paddingHorizontal: 12,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.light.bodyDark,
    flex: 1,
  },
  actionButtons: {
    width: "100%",
    flexDirection: "row",
    paddingTop: theme.spacing.regular,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.regular,
    justifyContent: "space-between",
  },
  button: {
    width: "45%",
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.light.borderDark,
    borderRadius: theme.radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
  },
  requestButtonText: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.header2,
  },
});

export default RideRegistrationScreen;
