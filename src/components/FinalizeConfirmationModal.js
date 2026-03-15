import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
} from 'react-native';
import { colors } from '../styles/colors';

const FinalizeConfirmationModal = ({ visible, onClose, onConfirm, rideDetails }) => {
  const titleRef = useRef(null);

  // Keep your formatting helpers, but memoize the final strings so we can announce them nicely.
  const formatDate = (date) => {
    if (!date) return 'Now';

    // If it's already a formatted string like "Feb 15, 2026", return it
    if (typeof date === 'string' && date.includes(',')) {
      const today = new Date();
      const dateStr = date.trim();
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        const isToday = parsed.toDateString() === today.toDateString();
        return isToday ? `${dateStr} (Today)` : dateStr;
      }
      return dateStr;
    }

    const today = new Date();
    const rideDate = new Date(date);

    if (isNaN(rideDate.getTime())) return String(date);

    const isToday = rideDate.toDateString() === today.toDateString();
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = rideDate.toLocaleDateString('en-US', options);

    return isToday ? `${dateStr} (Today)` : dateStr;
  };

  const formatTime = (time) => time || 'Now';

  const summary = useMemo(() => {
    if (!rideDetails) return '';
    const when = `${formatDate(rideDetails.pickupDate)} at ${formatTime(rideDetails.pickupTime)}`;
    return `Finalize booking. Pickup ${when}. Pickup location: ${rideDetails.pickupLocationName}. Dropoff location: ${rideDetails.dropoffLocationName}.`;
  }, [rideDetails]);

  // 🔑 Move VoiceOver focus INTO the modal when it opens + announce context
  useEffect(() => {
    if (!visible) return;

    // Announce the modal opening (helps orient user)
    AccessibilityInfo.announceForAccessibility?.('Finalize booking dialog opened.');

    // Then move focus to the title after render
    const t = setTimeout(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }, 150);

    return () => clearTimeout(t);
  }, [visible]);

  // If rideDetails are missing, don’t render content
  if (!rideDetails) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      {/* Overlay should not be focusable */}
      <View style={styles.overlay} accessible={false} importantForAccessibility="no">
        <View
          style={styles.modalContainer}
          // These two are the “make it a real modal” flags for iOS VO
          accessibilityViewIsModal={true}
          importantForAccessibility="yes"
          accessibilityRole="dialog"
          accessibilityLabel="Finalize booking"
        >
          <View style={styles.header}>
            <Text ref={titleRef} style={styles.title} accessibilityRole="header">
              Finalize your booking?
            </Text>

            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close and return to ride booking details"
              accessibilityHint="Closes the finalize booking dialog"
              style={styles.closeButton}
            >
              <Text
                style={styles.closeButtonText}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Here are the details of your ride:
          </Text>

          {/* Give VoiceOver a single nice summary as well as the individual lines */}
          <View
            style={styles.detailsContainer}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={summary}
          >
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Date &amp; Time:</Text>
              <Text style={styles.detailValue}>
                {formatDate(rideDetails.pickupDate)} @ {formatTime(rideDetails.pickupTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Location:</Text>
              <Text style={styles.detailValue}>{rideDetails.pickupLocationName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dropoff Location:</Text>
              <Text style={styles.detailValue}>
                {rideDetails.dropoffLocationName}
                {rideDetails.dropoffLocation && (rideDetails.dropoffLocation.includes('CoDa') || rideDetails.dropoffLocation.includes('Computing and Data Science')) && ' 📍(37.4300, -122.1675)'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Complete booking"
            accessibilityHint="Finalizes your ride request"
          >
            <Text style={styles.confirmButtonText}>Complete booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    paddingRight: 10,
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  confirmButton: {
    backgroundColor: colors.text,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FinalizeConfirmationModal;
