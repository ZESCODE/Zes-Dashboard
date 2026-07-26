/**
 * ZES Frost Edition — 4-Color Glassmorphic Token System
 * 
 * Maps semantic states to frost color variants.
 * Replaces hardcoded color strings across the dashboard.
 */

export type FrostColor = "green" | "blue" | "orange" | "red";

export interface FrostTokens {
  color: FrostColor;
  cardClass: string;
  accent: string;
  progressBar: string;
  iconBg: string;
  border: string;
}

export const frostMap: Record<FrostColor, FrostTokens> = {
  green: {
    color: "green",
    cardClass: "glass-frost-green",
    accent: "text-emerald-300",
    progressBar: "bg-emerald-500",
    iconBg: "bg-emerald-500/20",
    border: "border-emerald-500/40",
  },
  blue: {
    color: "blue",
    cardClass: "glass-frost-blue",
    accent: "text-blue-300",
    progressBar: "bg-blue-500",
    iconBg: "bg-blue-500/20",
    border: "border-blue-500/40",
  },
  orange: {
    color: "orange",
    cardClass: "glass-frost-orange",
    accent: "text-orange-300",
    progressBar: "bg-orange-500",
    iconBg: "bg-orange-500/20",
    border: "border-orange-500/40",
  },
  red: {
    color: "red",
    cardClass: "glass-frost-red",
    accent: "text-red-300",
    progressBar: "bg-red-500",
    iconBg: "bg-red-500/20",
    border: "border-red-500/40",
  },
};

export function getFrostTokens(status: string): FrostTokens {
  const s = status.toLowerCase();
  if (s === "running" || s === "active" || s === "success" || s === "healthy") return frostMap.green;
  if (s === "warning" || s === "degraded" || s === "pending") return frostMap.orange;
  if (s === "error" || s === "critical" || s === "failed") return frostMap.red;
  return frostMap.blue;
}

export function getFrostClass(frost?: FrostColor): string {
  if (!frost) return "glass-card";
  return "glass-frost-" + frost;
}
