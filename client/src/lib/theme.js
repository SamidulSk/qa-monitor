// src/lib/theme.js
import { createContext, useContext } from "react";

export const ThemeContext = createContext({ isDark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

/* Chart colors need literal values (SVG presentation attributes don't resolve
   CSS variables reliably). Kept in sync with the tokens in index.css. */
const CHART = {
  dark: {
    grid: "#20242B", axis: "#2C313A", text: "#8B929C", surface: "#111316",
    success: "#3DD68C", danger: "#F2555A", accent: "#4F8CFF", warn: "#F5B544", muted: "#3A404A",
    series1: "#3987e5", series2: "#d55181", // validated categorical pair (CVD-safe)
  },
  light: {
    grid: "#ECEEF1", axis: "#D5D9DF", text: "#5B6472", surface: "#FFFFFF",
    success: "#12A150", danger: "#DC2E3A", accent: "#2F6BFF", warn: "#C27803", muted: "#CDD2D9",
    series1: "#2a78d6", series2: "#d55181",
  },
};

export const useChartColors = () => CHART[useTheme().isDark ? "dark" : "light"];
