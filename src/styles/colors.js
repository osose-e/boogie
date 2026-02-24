// Light and dark palettes for the digital dispatcher (BLV-friendly contrast).
export const lightColors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  secondary: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  backgroundLight: '#F9FAFB',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
  disabled: '#9CA3AF',
};

export const darkColors = {
  primary: '#818CF8',
  primaryDark: '#6366F1',
  secondary: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  background: '#111827',
  backgroundLight: '#1F2937',
  border: '#374151',
  success: '#34D399',
  error: '#F87171',
  disabled: '#6B7280',
};

// Default export for files that don't use theme (backwards compat).
export const colors = lightColors;
