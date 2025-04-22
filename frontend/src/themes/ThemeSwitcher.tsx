import React from "react";
import { useTheme } from "./ThemeProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <Select
      value={theme.name}
      onValueChange={(value) => {
        const newTheme = availableThemes.find((t) => t.name === value);
        if (newTheme) {
          setTheme(newTheme);
        }
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        {availableThemes.map((theme) => (
          <SelectItem key={theme.name} value={theme.name}>
            {theme.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 