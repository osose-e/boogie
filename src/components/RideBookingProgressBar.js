import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';
import { theme } from '../styles/themes';
import { useTheme } from '../contexts/ThemeContext';

const TOTAL_STEPS = 5;

/**
 * Screen-reader accessible progress bar for the ride booking flow (search flow only).
 * Steps: 1 = pickup location, 2 = pickup entrance, 3 = dropoff location, 4 = dropoff entrance, 5 = ride details.
 * After step 5 the bar stays full for RideConfirmation.
 * When in focus, the screen reader announces: "Progress: Steps X/5 Completed".
 * @param {number} completedSteps - Number of steps completed (1 to 5). Segments filled up to this value; 5 keeps bar full on later screens.
 */
const RideBookingProgressBar = ({ completedSteps = 1 }) => {
  const clamped = Math.max(1, Math.min(completedSteps, TOTAL_STEPS));
  const label = `Progress: Steps ${clamped}/${TOTAL_STEPS} Completed`;
  const { theme } = useTheme();

  return (
    <View
      style={styles.wrapper}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: clamped }}
      accessibilityHint={`Step ${clamped} of ${TOTAL_STEPS} in the ride booking process.`}
      importantForAccessibility="yes"
      focusable={true}
    >
      <View style={styles.segments}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                backgroundColor: i < clamped ? "#09A6B8" : theme.colors.progressUnfilled
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: theme.spacing.lg,
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
    height: 5,
    borderRadius: 4,
  },
  segmentFilled: {
    backgroundColor: theme.colors.light.primary,
  },
});

export default RideBookingProgressBar;
export { TOTAL_STEPS };
