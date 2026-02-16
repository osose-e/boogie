import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../styles/colors';

const FinalizeConfirmationModal = ({ visible, onClose, onConfirm, rideDetails }) => {
  if (!rideDetails) return null;

  const formatDate = (date) => {
    if (!date) return 'Now';
    
    // If it's already a formatted string like "Feb 15, 2026", return it
    if (typeof date === 'string' && date.includes(',')) {
      const today = new Date();
      const dateStr = date.trim();
      // Try to parse and check if it's today
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        const isToday = parsed.toDateString() === today.toDateString();
        return isToday ? `${dateStr} (Today)` : dateStr;
      }
      return dateStr;
    }
    
    // Otherwise try to parse as ISO string or Date object
    const today = new Date();
    const rideDate = new Date(date);
    
    if (isNaN(rideDate.getTime())) {
      return date; // Return as-is if can't parse
    }
    
    const isToday = rideDate.toDateString() === today.toDateString();
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = rideDate.toLocaleDateString('en-US', options);
    
    return isToday ? `${dateStr} (Today)` : dateStr;
  };

  const formatTime = (time) => {
    return time || 'Now';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer} accessible={true} accessibilityRole="alertdialog">
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Finalize your booking?
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle} accessibilityRole="text">
            Here are the details of your ride:
          </Text>
          
          <View style={styles.detailsContainer} accessible={true}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Date & Time:</Text>
              <Text style={styles.detailValue}>
                {formatDate(rideDetails.pickupDate)} @ {formatTime(rideDetails.pickupTime)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Location:</Text>
              <Text style={styles.detailValue}>{rideDetails.pickupLocation}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dropoff Location:</Text>
              <Text style={styles.detailValue}>{rideDetails.dropoffLocation}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Complete booking"
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
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
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
  },
  closeButton: {
    padding: 4,
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
