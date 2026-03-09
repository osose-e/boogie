import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { colors } from '../styles/colors';
import RideBookingProgressBar from '../components/RideBookingProgressBar';
import CancelConfirmationModal from '../components/CancelConfirmationModal';
import FinalizeConfirmationModal from '../components/FinalizeConfirmationModal';

const RideRegistrationScreen = ({ navigation, route }) => {
  const {
    pickupLocationName = '518 Memorial Way, Stanford, CA 94305',
    dropoffLocationName = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
    pickupLocation = '518 Memorial Way, Stanford, CA 94305',
    dropoffLocation = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
    dropoffEntranceDescriptor,
  } = route.params || {};

  const [pickupTime, setPickupTime] = useState('later'); // 'now' or 'later'
  const now = new Date();

  const [pickupDate, setPickupDate] = useState(
    now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  );
  
  const [pickupTimeValue, setPickupTimeValue] = useState(
    now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );
  const [notes, setNotes] = useState('');
  const [needsWheelchair, setNeedsWheelchair] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

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
      dropoffLocationName,
      pickupLocationName,
      dropoffEntranceDescriptor,
      pickupDate: confirmationDate,
      pickupTime: pickupTime === 'now' ? 'Now' : pickupTimeValue,
      needsWheelchair,
    });
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Complete Ride Booking
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <RideBookingProgressBar completedSteps={2} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

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
              <View style={styles.dateTimeColumn}>
                <Text style={styles.dateTimeLabel}   accessible={false} 
              importantForAccessibility="no"
              accessibilityElementsHidden={true}>Date</Text>
                <View style={styles.dateTimeInputContainer}>
                  <TextInput
                    style={styles.dateTimeInput}
                    value={pickupDate}
                    onChangeText={setPickupDate}
                    accessibilityLabel="Pickup date"
                    accessibilityRole="textbox"
                  />
                </View>
              </View>
              <View style={styles.dateTimeColumn}>
                <Text style={styles.dateTimeLabel}   accessible={false} 
              importantForAccessibility="no"
              accessibilityElementsHidden={true}>Time</Text>
                <View style={styles.dateTimeInputContainer}>
                  <TextInput
                    style={styles.dateTimeInput}
                    value={pickupTimeValue}
                    onChangeText={setPickupTimeValue}
                    placeholder="HH:MM"
                    accessibilityLabel="Pickup time"
                    accessibilityRole="textbox"
                  />
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
            <Text style={styles.locationText}>{pickupLocationName}</Text>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionLabel} accessibilityRole="text">
            Dropoff Location
          </Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{dropoffLocationName}</Text>
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
            placeholder="Notes for the driver. (Optional, max. 100 characters)"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={100}
            accessibilityRole="textbox"
          />
          <Text style={styles.notesCounter} 
              accessible={false} 
              importantForAccessibility="no"
              accessibilityElementsHidden={true}>
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
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.secondary}
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
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.secondary}
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
          pickupLocationName,
          dropoffLocationName,
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 32,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  timeToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeToggleText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  timeToggleTextActive: {
    color: colors.secondary,
  },
  dateTimeContainer: {
    gap: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dateTimeColumn: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'left',
  },
  dateTimeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    importantForAccessibility: "no",
    accessibilityElementsHidden: true,
    accessible: false,
  },
  dateTimeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeInput: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
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
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesCounter: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.text,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  requestButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.text,
    alignItems: 'center',
  },
  requestButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideRegistrationScreen;
