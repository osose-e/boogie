import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';

const CancelConfirmationModal = ({ visible, onClose, onConfirm }) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
          accessible={true}
          accessibilityRole="alert"
        >
          <Text
            style={[styles.title, { color: theme.colors.header2 }]}
            accessibilityRole="header"
          >
            Cancel your booking?
          </Text>
          <Text
            style={[styles.message, { color: theme.colors.bodyDark }]}
            accessibilityRole="text"
          >
            {"Are you sure you want to cancel\nyour booking?"}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  borderWidth: 1,
                  borderColor: theme.colors.borderDark,
                  backgroundColor: theme.colors.buttonPrimary,
                },
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="No, do not cancel booking"
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.buttonTextPrimary },
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  borderWidth: 1,
                  borderColor: theme.colors.borderDark,
                  backgroundColor: theme.colors.buttonSecondary,
                },
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Yes, cancel booking"
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.buttonTextSecondary },
                ]}
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    borderRadius: theme.radius.modal,
    // padding: theme.spacing.regular,
    paddingVertical: 30,
    paddingHorizontal: theme.spacing.small,
    width: "80%",
    alignItems: "center",
    // maxWidth: 400,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.header2,
    marginBottom: theme.spacing.small,
  },
  message: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
    marginBottom: theme.spacing.regular,
    textAlign: "center",
    borderColor: "red",
    // borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    borderColor: "red",
    // borderWidth: 1,
  },
  button: {
    // flex: 1,
    // width: "50%",
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: "center",
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.body,
  },
});

export default CancelConfirmationModal;
