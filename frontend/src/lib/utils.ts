import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPct(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

export type RegimeType = "Risk ON" | "Neutral" | "Risk OFF";

export const REGIME_CONFIG: Record<RegimeType, {
  color: string;
  bg: string;
  border: string;
  dot: string;
  text: string;
  badge: string;
  glow: string;
  action: string;
  actionColor: string;
}> = {
  "Risk ON": {
    color: "#22c55e",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    action: "Invest Fully",
    actionColor: "bg-emerald-500 hover:bg-emerald-400",
  },
  "Neutral": {
    color: "#eab308",
    bg: "bg-yellow-950/40",
    border: "border-yellow-500/30",
    dot: "bg-yellow-400",
    text: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    glow: "shadow-yellow-500/20",
    action: "Stay Balanced",
    actionColor: "bg-yellow-500 hover:bg-yellow-400",
  },
  "Risk OFF": {
    color: "#ef4444",
    bg: "bg-red-950/40",
    border: "border-red-500/30",
    dot: "bg-red-400",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    glow: "shadow-red-500/20",
    action: "Reduce Risk",
    actionColor: "bg-red-500 hover:bg-red-400",
  },
};
