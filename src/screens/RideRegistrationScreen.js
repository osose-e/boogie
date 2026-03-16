import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import StackHeader from '../components/StackHeader';
import RideBookingProgressBar from '../components/RideBookingProgressBar';
import CancelConfirmationModal from '../components/CancelConfirmationModal';
import FinalizeConfirmationModal from '../components/FinalizeConfirmationModal';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from "@expo/vector-icons";

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
  const [needsWheelchair, setNeedsWheelchair] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const { theme, themeMode } = useTheme();

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
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={themeMode === "light" ? "dark" : "light"} />
      <StackHeader title="Complete Ride Booking" />
      <RideBookingProgressBar key="ride-reg-5" completedSteps={5} />

      <ScrollView
        style={[styles.content, { borderTopColor: theme.colors.border }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.header3 }]}
            accessibilityRole="text"
          >
            Pick-up Time
          </Text>
          <View style={styles.timeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.timeToggle,
                pickupTime === "now" && styles.timeToggleActive,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => setPickupTime("now")}
              accessibilityRole="button"
              accessibilityLabel="Select pickup time: Now"
              accessibilityState={{ selected: pickupTime === "now" }}
            >
              <Text
                style={[
                  styles.timeToggleText,
                  {
                    color:
                      pickupTime === "now"
                        ? theme.colors.background
                        : theme.colors.body,
                  },
                ]}
              >
                Now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeToggle,
                pickupTime === "later" && styles.timeToggleActive,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => setPickupTime("later")}
              accessibilityRole="button"
              accessibilityLabel="Select pickup time: Later"
              accessibilityState={{ selected: pickupTime === "later" }}
            >
              <Text
                style={[
                  styles.timeToggleText,
                  {
                    color:
                      pickupTime === "later"
                        ? theme.colors.background
                        : theme.colors.body,
                  },
                ]}
              >
                Later
              </Text>
            </TouchableOpacity>
          </View>

          {pickupTime === "later" && (
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeColumn}>
                <Text
                  style={[styles.dateTimeLabel, { color: theme.colors.body }]}
                  accessible={false}
                  importantForAccessibility="no"
                  accessibilityElementsHidden={true}
                >
                  Date
                </Text>
                <View
                  style={[
                    styles.dateTimeInputContainer,
                    { backgroundColor: theme.colors.separator },
                  ]}
                >
                  <TextInput
                    style={styles.dateTimeInput}
                    value={pickupDate}
                    onChangeText={setPickupDate}
                    accessibilityLabel="Pickup date"
                    accessibilityRole="textbox"
                  />
                  <Ionicons
                    name="pencil"
                    size={24}
                    color={theme.colors.icons}
                  />
                </View>
              </View>
              <View style={styles.dateTimeColumn}>
                <Text
                  style={[styles.dateTimeLabel, { color: theme.colors.body }]}
                  accessible={false}
                  importantForAccessibility="no"
                  accessibilityElementsHidden={true}
                >
                  Time
                </Text>
                <View
                  style={[
                    styles.dateTimeInputContainer,
                    { backgroundColor: theme.colors.separator },
                  ]}
                >
                  <TextInput
                    style={styles.dateTimeInput}
                    value={pickupTimeValue}
                    onChangeText={setPickupTimeValue}
                    placeholder="HH:MM"
                    accessibilityLabel="Pickup time"
                    accessibilityRole="textbox"
                  />
                  <Ionicons
                    name="pencil"
                    size={24}
                    color={theme.colors.icons}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.body }]}
            accessibilityRole="text"
          >
            Pickup Location
          </Text>
          <View style={styles.locationContainer}>
            <Text style={[styles.locationText, { color: theme.colors.body }]}>
              {pickupLocationName}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.body }]}
            accessibilityRole="text"
          >
            Dropoff Location
          </Text>
          <View style={styles.locationContainer}>
            <Text style={[styles.locationText, { color: theme.colors.body }]}>
              {dropoffLocationName}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.body }]}
            accessibilityRole="text"
          >
            Notes
          </Text>
          <TextInput
            style={[styles.notesInput, { borderColor: theme.colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes for the driver. (Optional, max. 100 characters)"
            placeholderTextColor={theme.colors.bodyPlaceholder}
            multiline
            maxLength={100}
            accessibilityRole="textbox"
          />
          <Text
            style={[styles.notesCounter, { color: theme.colors.body }]}
            accessible={false}
            importantForAccessibility="no"
            accessibilityElementsHidden={true}
          >
            {notes.length}/100
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text
              style={[styles.switchLabel, { color: theme.colors.body }]}
              accessibilityRole="text"
            >
              Check if you need a wheelchair
            </Text>
            <Switch
              value={needsWheelchair}
              onValueChange={setNeedsWheelchair}
              trackColor={{ false: theme.colors.background, true: "#09A6B8" }}
              thumbColor={"#FFFFFF"}
              accessibilityRole="switch"
              accessibilityLabel="Wheelchair accessibility needed"
              accessibilityState={{ checked: needsWheelchair }}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text
              style={[styles.switchLabel, { color: theme.colors.body }]}
              accessibilityRole="text"
            >
              This is a recurring request
            </Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: theme.colors.background, true: "#09A6B8" }}
              thumbColor={"#FFFFFF"}
              accessibilityRole="switch"
              accessibilityLabel="Recurring ride request"
              accessibilityState={{ checked: isRecurring }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionButtons, {borderTopColor: theme.colors.border}]}>
        <TouchableOpacity
          style={[styles.cancelButton, {borderColor: theme.colors.border}]}
          onPress={() => setShowCancelModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Cancel booking"
        >
          <Text style={[styles.cancelButtonText, {color: theme.colors.body}]}>Cancel booking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleRequestRide}
          accessibilityRole="button"
          accessibilityLabel="Request ride"
        >
          <Text style={[styles.requestButtonText, {color: theme.colors.background}]}>Request ride</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backIcon: {
    fontSize: 32,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    marginTop: theme.spacing.md,
    borderTopWidth: 2,
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
    fontFamily: theme.fonts.header3,
    marginBottom: 12,
  },
  timeToggleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  timeToggle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  timeToggleActive: {
    backgroundColor: theme.colors.light.primary,
    borderWidth: 0,
  },
  timeToggleText: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
  },
  dateTimeContainer: {
    gap: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateTimeColumn: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "left",
  },
  dateTimeLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.header3,
    importantForAccessibility: "no",
    accessibilityElementsHidden: true,
    accessible: false,
  },
  dateTimeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dateTimeInput: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 120,
  },
  locationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
  notesInput: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    minHeight: 80,
    textAlignVertical: "top",
  },
  notesCounter: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 2,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: "center",
    backgroundColor: theme.colors.light.primary,
  },
  requestButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
  },
});

export default RideRegistrationScreen;
