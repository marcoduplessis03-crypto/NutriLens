export const COLORS = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  primary: "#0F766E",
  safe: "#16A34A",
  low: "#EAB308",
  moderate: "#F97316",
  high: "#DC2626",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",

  // Overlays used in camera UI
  overlayDark: "rgba(0,0,0,0.62)",
  overlayLight: "rgba(255,255,255,0.97)",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
} as const;