import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from "@expo/vector-icons";

const CancelConfirmationModal = ({ visible, onClose, onConfirm }) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          accessible={true}
          accessibilityRole="alertdialog"
        >
          <Text
            style={[styles.title, { color: theme.colors.header2 }]}
            accessibilityRole="header"
          >
            Cancel your booking?
          </Text>
          <Text
            style={[styles.message, { color: theme.colors.body }]}
            accessibilityRole="text"
          >
            Are you sure you want to cancel your booking?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, {borderColor: theme.colors.border}]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Yes, cancel booking"
            >
              <Text style={[styles.buttonTextSecondary, {color: theme.colors.body}]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="No, do not cancel booking"
            >
              <Text style={[styles.buttonTextPrimary, {color: theme.colors.background}]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontFamily: theme.fonts.header3,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.light.primary,
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontFamily: theme.fonts.header3,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
});

export default CancelConfirmationModal;
