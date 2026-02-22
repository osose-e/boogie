import React from "react";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../contexts/ThemeContext";

export default function AppStatusBar() {
  const { themeMode, theme } = useTheme();

  return (
    <StatusBar
      style={themeMode === "light" ? "dark" : "light"}
      backgroundColor={theme.colors.background}
    />
  );
}