import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { colors } from '../styles/colors';

const RideConfirmationScreen = ({ navigation, route }) => {
  const {
    pickupLocation: initialPickupLocation = '📍Current Location (37.4275, -122.1697)',
    dropoffLocation: initialDropoffLocation = 'Computing and Data Science (CoDa), 385 Serra St., Stanford, CA 94305',
    pickupDate: initialPickupDate = 'Feb 15 (Today), 2026',
    pickupTime: initialPickupTime = '21:15',
    needsWheelchair: initialNeedsWheelchair = true,
  } = route.params || {};

  const [pickupLocation, setPickupLocation] = useState(initialPickupLocation);
  const [dropoffLocation, setDropoffLocation] = useState(initialDropoffLocation);
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [pickupTime, setPickupTime] = useState(initialPickupTime);
  const [needsWheelchair, setNeedsWheelchair] = useState(initialNeedsWheelchair);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, you would save the changes to your backend here
  };

  const handleCancel = () => {
    // Revert to original values
    setPickupLocation(initialPickupLocation);
    setDropoffLocation(initialDropoffLocation);
    setPickupDate(initialPickupDate);
    setPickupTime(initialPickupTime);
    setNeedsWheelchair(initialNeedsWheelchair);
    setIsEditing(false);
  };

  const logoRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        const node = findNodeHandle(logoRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 400);
      return () => clearTimeout(t);
    }, [])
  );

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
      <View style={styles.header}>
        <Text 
          ref={logoRef}
          style={styles.logo} 
          accessibilityRole="text"
          accessible={true}
          importantForAccessibility="yes"
          accessibilityLabel="Boogie app"
        >
          boogie
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? 'Cancel editing' : 'Edit ride details'}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationTitle} accessibilityRole="header">
            Your ride is booked!
          </Text>

          <View style={styles.detailsContainer} accessible={true}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} accessibilityRole="text">
                Pickup Date & Time:
              </Text>
              {isEditing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={pickupDate}
                    onChangeText={setPickupDate}
                    accessibilityLabel="Edit pickup date"
                    accessibilityRole="textbox"
                  />
                  <Text style={styles.atSymbol}>@</Text>
                  <TextInput
                    style={styles.editInput}
                    value={pickupTime}
                    onChangeText={setPickupTime}
                    accessibilityLabel="Edit pickup time"
                    accessibilityRole="textbox"
                  />
                </View>
              ) : (
                <Text style={styles.detailValue} accessibilityRole="text">
                  {pickupDate} @ {pickupTime}
                </Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} accessibilityRole="text">
                Pickup Location:
              </Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInputFull}
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                  multiline
                  accessibilityLabel="Edit pickup location"
                  accessibilityRole="textbox"
                />
              ) : (
                <Text style={styles.detailValue} accessibilityRole="text">
                  {pickupLocation}
                </Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} accessibilityRole="text">
                Dropoff Location:
              </Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInputFull}
                  value={dropoffLocation}
                  onChangeText={setDropoffLocation}
                  multiline
                  accessibilityLabel="Edit dropoff location"
                  accessibilityRole="textbox"
                />
              ) : (
                <Text style={styles.detailValue} accessibilityRole="text">
                  {dropoffLocation}
                </Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel} accessibilityRole="text">
                Wheelchair Accessibility:
              </Text>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.wheelchairToggle}
                  onPress={() => setNeedsWheelchair(!needsWheelchair)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: needsWheelchair }}
                  accessibilityLabel={needsWheelchair ? 'Wheelchair needed, double tap to disable' : 'Wheelchair not needed, double tap to enable'}
                >
                  <Text style={styles.wheelchairToggleText}>
                    {needsWheelchair ? 'Yes ♿' : 'No'}
                  </Text>
                </TouchableOpacity>
              ) : needsWheelchair ? (
                <View style={styles.wheelchairContainer}>
                  <Text style={styles.wheelchairIcon} accessibilityRole="text">
                    ♿
                  </Text>
                  <Text style={styles.wheelchairText} accessibilityRole="text">
                    You have noted need for a wheelchair.
                  </Text>
                </View>
              ) : (
                <Text style={styles.detailValue} accessibilityRole="text">
                  No wheelchair needed
                </Text>
              )}
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

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
      </ScrollView>
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
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  editInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: colors.text,
  },
  editInputFull: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
    minHeight: 50,
  },
  atSymbol: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  wheelchairToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  wheelchairToggleText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
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
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
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
