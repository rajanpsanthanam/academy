import { authTheme } from "./authTheme";

export const applyAuthTheme = () => {
  const root = document.documentElement;
  Object.entries(authTheme.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}; 