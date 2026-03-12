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
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import { DEFAULT_PICKUP_LOCATION } from '../constants/stanfordLocations';
import CancelConfirmationModal from '../components/CancelConfirmationModal';
import FinalizeConfirmationModal from '../components/FinalizeConfirmationModal';
import StackHeader from '../components/StackHeader';

const RideRegistrationScreen = ({ navigation, route }) => {
  const {
    pickupLocation = DEFAULT_PICKUP_LOCATION.displayText,
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
    navigation.goBack();
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
    <SafeAreaView style={styles.container}>
      <StackHeader title="Complete Ride Booking" ref={headerTitleRef} />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <View style={styles.currentLocationContainer}>
          <Text style={styles.currentLocationLabel} accessibilityRole="text">
            Your ride to {dropoffLocation}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel} accessibilityRole="text">
            Pick-up Time
          </Text>
          <View style={styles.timeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.timeToggle,
                pickupTime === 'now' && styles.timeToggleActive,
              ]}
              onPress={() => setPickupTime('now')}
              accessibilityRole="button"
              accessibilityLabel="Select pickup time: Now"
              accessibilityState={{ selected: pickupTime === 'now' }}
            >
              <Text
                style={[
                  styles.timeToggleText,
                  pickupTime === 'now' && styles.timeToggleTextActive,
                ]}
              >
                Now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeToggle,
                pickupTime === 'later' && styles.timeToggleActive,
              ]}
              onPress={() => setPickupTime('later')}
              accessibilityRole="button"
              accessibilityLabel="Select pickup time: Later"
              accessibilityState={{ selected: pickupTime === 'later' }}
            >
              <Text
                style={[
                  styles.timeToggleText,
                  pickupTime === 'later' && styles.timeToggleTextActive,
                ]}
              >
                Later
              </Text>
            </TouchableOpacity>
          </View>

          {pickupTime === 'later' && (
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
            <Text style={styles.locationText}>{pickupLocation}</Text>
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
            placeholderTextColor={theme.colors.bodyPlaceholder}
            multiline
            maxLength={100}
            accessibilityLabel="Notes for the driver, optional, maximum 100 characters"
            accessibilityRole="textbox"
          />
          <Text style={styles.notesCounter}>
            {notes.length}/100
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel} accessibilityRole="text">
              Check if you need a wheelchair
            </Text>
            <Switch
              value={needsWheelchair}
              onValueChange={setNeedsWheelchair}
              trackColor={{ false: theme.colors.border, true: theme.colors.wordmark.primary }}
              thumbColor={theme.colors.wordmark.secondary}
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
              trackColor={{ false: theme.colors.border, true: theme.colors.wordmark.primary }}
              thumbColor={theme.colors.wordmark.secondary}
              accessibilityRole="switch"
              accessibilityLabel="Recurring ride request"
              accessibilityState={{ checked: isRecurring }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowCancelModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Cancel booking"
        >
          <Text style={styles.cancelButtonText}>Cancel booking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleRequestRide}
          accessibilityRole="button"
          accessibilityLabel="Request ride"
        >
          <Text style={styles.requestButtonText}>Request ride</Text>
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
          pickupDate: pickupTime === 'now' ? new Date().toISOString() : pickupDate,
          pickupTime: pickupTime === 'now' ? 'Now' : pickupTimeValue,
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
    // backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    // borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 32,
    // color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    // color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  currentLocationContainer: {
    marginBottom: 24,
  },
  currentLocationLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    // color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.header2,
    // color: colors.text,
    marginBottom: 12,
  },
  timeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeToggle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    // backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    // borderColor: colors.border,
    alignItems: 'center',
  },
  timeToggleActive: {
    // backgroundColor: colors.primary,
    // borderColor: colors.primary,
  },
  timeToggleText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    // color: colors.text,
    fontWeight: '600',
  },
  timeToggleTextActive: {
    // color: colors.secondary,
  },
  dateTimeContainer: {
    gap: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    // color: colors.textSecondary,
  },
  dateTimeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeInput: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    // color: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    // backgroundColor: colors.backgroundLight,
    borderRadius: 6,
    minWidth: 120,
  },
  editIcon: {
    fontSize: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    // backgroundColor: colors.backgroundLight,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    // color: colors.text,
  },
  notesInput: {
    // backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    // borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    // color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesCounter: {
    fontSize: 12,
    // color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    // color: colors.text,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    // borderTopColor: colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    // backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    // borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    // color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  requestButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    // backgroundColor: colors.text,
    alignItems: 'center',
  },
  requestButtonText: {
    // color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideRegistrationScreen;
