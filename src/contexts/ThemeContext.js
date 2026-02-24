import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../styles/colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemDark = useColorScheme() === 'dark';
  const [themeMode, setThemeMode] = useState(null); // 'light' | 'dark' | null (system)
  const isDark = themeMode === 'dark' || (themeMode === null && systemDark);
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(
    () => ({
      theme: isDark ? 'dark' : 'light',
      colors,
      isDark,
      toggleTheme,
    }),
    [isDark, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
