"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export type FrostColor = "green" | "blue" | "orange" | "red";

const statFrost: Record<
  FrostColor,
  { card: string; iconBg: string; iconText: string; accent: string; badgeBg: string; badgeText: string }
> = {
  green: {
    card: "glass-frost-green",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-300",
    accent: "text-emerald-300",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
  },
  blue: {
    card: "glass-frost-blue",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-300",
    accent: "text-blue-300",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-300",
  },
  orange: {
    card: "glass-frost-orange",
    iconBg: "bg-orange-500/15",
    iconText: "text-orange-300",
    accent: "text-orange-300",
    badgeBg: "bg-orange-500/15",
    badgeText: "text-orange-300",
  },
  red: {
    card: "glass-frost-red",
    iconBg: "bg-red-500/15",
    iconText: "text-red-300",
    accent: "text-red-300",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-300",
  },
};

export function GlassStatCard({
  label,
  value,
  change,
  icon: Icon,
  frost,
  trend = "up",
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  frost: FrostColor;
  trend?: "up" | "down";
}) {
  const t = statFrost[frost];
  return (
    <div className={cn("rounded-xl p-5 transition-all duration-300", t.card)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("size-9 rounded-lg flex items-center justify-center backdrop-blur-sm", t.iconBg)}>
          <Icon className={cn("size-4", t.iconText)} />
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5",
            t.badgeBg,
            t.badgeText
          )}
        >
          <ArrowRight
            className={cn(
              "size-3",
              trend === "up" ? "rotate-[-90deg]" : "rotate-90"
            )}
          />
          {change}
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-foreground/70 font-semibold mb-0.5">
        {label}
      </div>
      <div className={cn("text-2xl font-display font-bold", t.accent)}>{value}</div>
    </div>
  );
}
