import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, themes, defaultTheme } from "./themeConfig";
import { useAuth } from "@/lib/context/AuthContext";
import { apiService } from "@/lib/services/apiService";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultThemeName?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultThemeName,
}) => {
  const { state } = useAuth();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize with system preference and fetch user preferences
  useEffect(() => {
    const initializeTheme = async () => {
      // Don't make API calls while authentication is loading
      if (state.isLoading) return;

      // For unauthenticated users, use default theme and system preference
      if (!state.isAuthenticated || !state.user) {
        setThemeState(defaultTheme);
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemDarkMode);
        document.documentElement.classList.toggle('dark', systemDarkMode);
        return;
      }

      try {
        // Get user preferences
        const userResponse = await apiService.users.get('me');
        const { dark_mode, organization } = userResponse.data;
        
        // Set dark mode from user preference
        setIsDarkMode(dark_mode);
        document.documentElement.classList.toggle('dark', dark_mode);
        
        // Only fetch organization theme if organization data is available
        if (organization?.id) {
          const orgResponse = await apiService.organizations.get(organization.id);
          const { theme: orgTheme } = orgResponse.data;
          
          // Set theme from organization
          const theme = themes.find((t) => t.name === orgTheme) || defaultTheme;
          setThemeState(theme);
        } else {
          // Fallback to default theme if no organization data
          setThemeState(defaultTheme);
        }
      } catch (error) {
        console.error('Error fetching theme preferences:', error);
        // Fallback to default theme and system preference
        setThemeState(defaultTheme);
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemDarkMode);
        document.documentElement.classList.toggle('dark', systemDarkMode);
      }
    };

    initializeTheme();
  }, [state.isLoading, state.isAuthenticated, state.user]);

  // Apply dark mode class whenever isDarkMode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const setTheme = async (newTheme: Theme) => {
    try {
      if (state.isAuthenticated && state.user?.is_staff && state.user?.organization?.id) {
        await apiService.organizations.update(state.user.organization.id, {
          theme: newTheme.name,
        });
        setThemeState(newTheme);
      } else {
        // For unauthenticated users or non-staff, just update the local state
        setThemeState(newTheme);
      }
    } catch (error) {
      console.error('Error updating organization theme:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      if (state.isAuthenticated && state.user) {
        const newValue = !isDarkMode;
        await apiService.users.update('me', {
          dark_mode: newValue,
        });
        setIsDarkMode(newValue);
      } else {
        // For unauthenticated users, just update the local state
        setIsDarkMode(!isDarkMode);
      }
    } catch (error) {
      console.error('Error updating dark mode preference:', error);
    }
  };

  useEffect(() => {
    // Apply CSS variables based on theme and dark mode
    const root = document.documentElement;
    const varsToApply = isDarkMode && theme.darkModeVars 
      ? theme.darkModeVars 
      : theme.cssVars;

    Object.entries(varsToApply).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme, isDarkMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        availableThemes: themes,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 