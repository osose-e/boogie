import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

const TOTAL_STEPS = 4;

/**
 * Screen-reader accessible progress bar for the ride booking flow (search flow only).
 * When in focus, the screen reader announces: "Progress: Steps X/4 Completed".
 * @param {number} completedSteps - Number of steps completed (0 to 3). Steps: 1 Pickup, 2 Dropoff, 3 Ride details, 4 Confirm.
 */
const RideBookingProgressBar = ({ completedSteps = 0 }) => {
  const clamped = Math.max(0, Math.min(completedSteps, TOTAL_STEPS));
  const label = `Progress: Steps ${clamped}/${TOTAL_STEPS} Completed`;

  return (
    <View
      style={styles.wrapper}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: TOTAL_STEPS, now: clamped }}
      accessibilityHint={`Step ${clamped + 1} of ${TOTAL_STEPS} in the ride booking process.`}
      importantForAccessibility="yes"
      focusable={true}
    >
      <View style={styles.segments}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              i < clamped ? styles.segmentFilled : styles.segmentEmpty,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  segments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  segmentFilled: {
    backgroundColor: colors.primary,
  },
  segmentEmpty: {
    backgroundColor: colors.border,
  },
});

export default RideBookingProgressBar;
export { TOTAL_STEPS };
