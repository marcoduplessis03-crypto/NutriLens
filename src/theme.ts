export const COLORS = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  cardSoft: "#F3FFFC",
  primary: "#057B75",
  primaryDark: "#03181B",
  teal: "#10B7A7",
  aqua: "#6AF2E0",
  ice: "#F3FFFC",

  safe: "#16A34A",
  low: "#EAB308",
  moderate: "#F97316",
  high: "#DC2626",

  safeSubtle: "rgba(22, 163, 74, 0.10)",
  lowSubtle: "rgba(234, 179, 8, 0.12)",
  moderateSubtle: "rgba(249, 115, 22, 0.10)",
  highSubtle: "rgba(220, 38, 38, 0.10)",

  text: "#102A2D",
  ink: "#03181B",
  muted: "#667A7F",
  border: "rgba(5,123,117,0.14)",
  line: "rgba(5,123,117,0.14)",
  overlayLight: "rgba(255,255,255,0.97)",
  overlayDark: "rgba(3,24,27,0.72)",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const SHADOWS = {
  soft: {
    shadowColor: "#03181B",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  strong: {
    shadowColor: "#03181B",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
} as const;
