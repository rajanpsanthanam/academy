import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, themes, defaultTheme } from "./themeConfig";
import { authTheme } from "./authTheme";

interface AuthThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
}

const AuthThemeContext = createContext<AuthThemeContextType | undefined>(undefined);

export const useAuthTheme = () => {
  const context = useContext(AuthThemeContext);
  if (!context) {
    throw new Error("useAuthTheme must be used within an AuthThemeProvider");
  }
  return context;
};

interface AuthThemeProviderProps {
  children: React.ReactNode;
}

export const AuthThemeProvider: React.FC<AuthThemeProviderProps> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize with system preference
  useEffect(() => {
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemDarkMode);
  }, []);

  useEffect(() => {
    // Apply auth theme CSS variables
    const root = document.documentElement;
    const varsToApply = authTheme.cssVars;

    Object.entries(varsToApply).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cleanup function to remove auth theme variables
    return () => {
      Object.keys(varsToApply).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, []);

  return (
    <AuthThemeContext.Provider
      value={{
        theme: defaultTheme,
        isDarkMode,
      }}
    >
      {children}
    </AuthThemeContext.Provider>
  );
}; 