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
import { useTheme } from '../contexts/ThemeContext';
import { lightColors } from '../styles/colors';
import CancelConfirmationModal from '../components/CancelConfirmationModal';
import FinalizeConfirmationModal from '../components/FinalizeConfirmationModal';

const RideRegistrationScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const {
    pickupLocation = '518 Memorial Way, Stanford, CA 94305',
    dropoffLocation = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
    dropoffLocationName,
    dropoffEntranceDescriptor,
  } = route.params || {};

  const [pickupTime, setPickupTime] = useState('later'); // 'now' or 'later'
  const [pickupDate, setPickupDate] = useState('Feb 15, 2026');
  const [pickupTimeValue, setPickupTimeValue] = useState('21:15');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} accessibilityRole="header">
          Complete Ride Booking
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.currentLocationContainer}>
          <Text style={[styles.currentLocationLabel, { color: colors.textSecondary }]} accessibilityRole="text">
            Pickup: {pickupLocation.substring(0, 50)}{pickupLocation.length > 50 ? '…' : ''}
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
            <Text style={styles.editIcon}>✏️</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text }]} accessibilityRole="text">
            Dropoff Location
          </Text>
          <View style={[styles.locationContainer, { backgroundColor: colors.backgroundLight }]}>
            <View style={{ flex: 1 }}>
              {dropoffLocationName && (
                <Text style={[styles.locationText, { color: colors.text }]}>{dropoffLocationName}</Text>
              )}
              {dropoffEntranceDescriptor && (
                <Text style={[styles.locationSubtext, { color: colors.textSecondary }]}>
                  {dropoffEntranceDescriptor}
                </Text>
              )}
              <Text style={[styles.locationText, { color: colors.text }]}>{dropoffLocation}</Text>
            </View>
            <Text style={styles.editIcon}>✏️</Text>
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
            placeholderTextColor={colors.textSecondary}
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
          pickupLocation,
          dropoffLocation,
        }}
      />
    </SafeAreaView>
  );
};

const c = lightColors;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: { fontSize: 32, color: c.text },
  headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
  headerSpacer: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  currentLocationContainer: { marginBottom: 24 },
  currentLocationLabel: { fontSize: 14, color: c.textSecondary },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 12 },
  timeToggleContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  timeToggle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: c.backgroundLight,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
  },
  timeToggleActive: { backgroundColor: c.primary, borderColor: c.primary },
  timeToggleText: { fontSize: 16, color: c.text, fontWeight: '600' },
  timeToggleTextActive: { color: c.secondary },
  dateTimeContainer: { gap: 16 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateTimeLabel: { fontSize: 14, color: c.textSecondary },
  dateTimeInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTimeInput: {
    fontSize: 16,
    color: c.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: c.backgroundLight,
    borderRadius: 6,
    minWidth: 120,
  },
  editIcon: { fontSize: 16 },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: c.backgroundLight,
    borderRadius: 8,
  },
  locationText: { fontSize: 16, color: c.text },
  locationSubtext: { fontSize: 14, fontStyle: 'italic', marginBottom: 4 },
  notesInput: {
    backgroundColor: c.backgroundLight,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: c.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesCounter: { fontSize: 12, color: c.textSecondary, textAlign: 'right', marginTop: 4 },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabel: { fontSize: 16, color: c.text, flex: 1 },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: c.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: c.backgroundLight,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
  },
  cancelButtonText: { color: c.text, fontSize: 16, fontWeight: '600' },
  requestButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: c.primary,
    alignItems: 'center',
  },
  requestButtonText: { color: c.secondary, fontSize: 16, fontWeight: '600' },
});

export default RideRegistrationScreen;
