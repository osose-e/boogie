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
import { useTheme } from '../contexts/ThemeContext';

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
            style={[styles.title, { color: theme.colors.text }]}
            accessibilityRole="header"
          >
            Cancel your booking?
          </Text>
          <Text
            style={[styles.message, { color: theme.colors.textSecondary }]}
            accessibilityRole="text"
          >
            Are you sure you want to cancel your booking?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.text,
                  borderColor: theme.colors.text,
                },
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="No, do not cancel booking"
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.background },
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Yes, cancel booking"
            >
              <Text
                style={[styles.buttonText, { color: theme.colors.text }]}
              >
                Yes
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CancelConfirmationModal;
