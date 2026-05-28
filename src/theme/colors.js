// Theme colors for PowerTrainingCoach app
// Replaces the CSS variables with React Native compatible values

export const colors = {
  // Primary colors
  primary: "#111827",
  primaryDark: "#020617",
  primaryLight: "#1f2937",
  
  // Background colors
  background: "#f5f5f7",
  backgroundWhite: "#ffffff",
  backgroundLight: "#f9f9f9",
  backgroundLighter: "#f8f8f8",
  backgroundMuted: "#f3f4f6",
  
  // Text colors
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  textWhite: "#ffffff",
  
  // Border colors
  border: "rgba(0,0,0,0.08)",
  borderDark: "rgba(0,0,0,0.18)",
  borderLight: "#e2e2e2",
  borderMedium: "#d4d4d8",
  
  // Accent colors
  success: "#10b981",
  successDark: "#059669",
  successLight: "#ecfdf5",
  successBorder: "#d1fae5",
  
  error: "#dc2626",
  errorDark: "#b91c1c",
  errorLight: "#fee2e2",
  
  warning: "#f59e0b",
  
  // Button colors
  buttonPrimary: "#111827",
  buttonPrimaryHover: "#020617",
  buttonDisabled: "rgba(17, 24, 39, 0.5)",
  
  // Stars/Ratings
  starActive: "#f59e0b",
  starInactive: "#cccccc",
  
  // Subscription badges
  badgeBackground: "#e5e7eb",
  badgeText: "#374151",
};

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 30,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const fonts = {
  display: "IBMPlexSans_600SemiBold",
  body: "IBMPlexSans_400Regular",
  bodyMedium: "IBMPlexSans_500Medium",
  bodySemiBold: "IBMPlexSans_600SemiBold",
  bodyBold: "IBMPlexSans_700Bold",
};

export const typography = {
  h1: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 44,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
  },
  h3: { fontSize: 22,
    lineHeight: 28,
  },
  body: { fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: { fontSize: 14,
    lineHeight: 20,
  },
  caption: { fontSize: 12,
    lineHeight: 16,
  },
  button: { fontSize: 16,
    lineHeight: 24,
  },
  buttonLarge: { fontSize: 18,
    lineHeight: 26,
  },
};

export default {
  colors,
  shadows,
  spacing,
  borderRadius,
  fonts,
  typography,
};
