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

  // Tinted surfaces — keep in sync with risk colors above
  safeSubtle: "#DCFCE7",
  lowSubtle: "#FEF9C3",
  moderateSubtle: "#FFEDD5",
  highSubtle: "#FEE2E2",

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

// ─── Semantic helpers ────────────────────────────────────────────────────────

import type { RiskVerdict } from "./types/product";

export function verdictColor(verdict: RiskVerdict): string {
  if (verdict === "Not Recommended") return COLORS.high;
  if (verdict === "Use With Caution") return COLORS.moderate;
  if (verdict === "Low Risk") return COLORS.low;
  return COLORS.safe;
}

export function verdictBackground(verdict: RiskVerdict): string {
  if (verdict === "Not Recommended") return COLORS.highSubtle;
  if (verdict === "Use With Caution") return COLORS.moderateSubtle;
  if (verdict === "Low Risk") return COLORS.lowSubtle;
  return COLORS.safeSubtle;
}

export function riskScoreColor(score: number): string {
  if (score >= 70) return COLORS.high;
  if (score >= 40) return COLORS.moderate;
  if (score > 0) return COLORS.low;
  return COLORS.safe;
}
