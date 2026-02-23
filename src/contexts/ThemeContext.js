import React, { createContext, useState, useContext } from "react";
import { theme } from "../styles/themes"; // your theme object

// 1️⃣ Create context
const ThemeContext = createContext();

// 2️⃣ Create provider
export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState("light"); // default

  // toggle between light and dark
  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  // pick the color palette based on mode
  const currentTheme = {
    ...theme,
    colors: theme.colors[themeMode],
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, theme: currentTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// 3️⃣ Hook to consume the context
export const useTheme = () => useContext(ThemeContext);