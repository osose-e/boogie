import React, { createContext, useState, useContext } from "react";
import { DefaultTheme } from "@react-navigation/native";
import { theme } from "../styles/themes";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState("light");

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const c = theme.colors[themeMode];
  const currentTheme = {
    ...theme,
    colors: c,
  };

  const navTheme = {
    ...DefaultTheme,
    dark: themeMode === "dark",
    colors: {
      ...DefaultTheme.colors,
      primary: c.header1,
      background: c.background,
      card: c.background,
      text: c.bodyDark,
      border: c.separator,
      notification: c.header1,
    },
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, theme: currentTheme, navTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// 3️⃣ Hook to consume the context
export const useTheme = () => useContext(ThemeContext);