export type ColorPalette = typeof DARK;

const DARK = {
  background: "#0A0E1A",
  surface: "#131929",
  surfaceElevated: "#1A2236",
  border: "#1E2D47",
  borderLight: "#253552",
  text: "#FFFFFF",
  textSecondary: "#7A8EA8",
  textMuted: "#3D5068",
  accent: "#00D4FF",
  accentGreen: "#00E676",
  accentRed: "#FF4757",
  accentOrange: "#FFA726",
  tint: "#00D4FF",
  tabIconDefault: "#3D5068",
  tabIconSelected: "#00D4FF",
  scoreGood: "#00E676",
  scoreOk: "#FFA726",
  scoreBad: "#FF4757",
  isDark: true,
};

const LIGHT = {
  background: "#F4F7FB",
  surface: "#FFFFFF",
  surfaceElevated: "#EDF1F7",
  border: "#DDE3EE",
  borderLight: "#C8D0E0",
  text: "#0A0E1A",
  textSecondary: "#4A5568",
  textMuted: "#A0AEC0",
  accent: "#0099BB",
  accentGreen: "#00A848",
  accentRed: "#D32F2F",
  accentOrange: "#E65100",
  tint: "#0099BB",
  tabIconDefault: "#A0AEC0",
  tabIconSelected: "#0099BB",
  scoreGood: "#00A848",
  scoreOk: "#E65100",
  scoreBad: "#D32F2F",
  isDark: false,
};

export default {
  dark: DARK,
  light: LIGHT,
};
