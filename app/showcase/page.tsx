"use client";

import React, { useState } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";
import {
  Sparkles, Zap, Shield, Eye, Play, Save, Copy,
  Check, AlertTriangle, ArrowRight,
  Mail, Heart, Activity, Cpu,
  Bell, Settings, User, Cloud, Database,
  Share2, Book,
} from "lucide-react";
import DashboardStat from "@/components/dashboard/stat";
import DashboardChart from "@/components/dashboard/chart";
import SecurityStatus from "@/components/dashboard/security-status";
import RebelsRanking from "@/components/dashboard/rebels-ranking";
import NotificationsWidget from "@/components/dashboard/notifications";
import Widget from "@/components/dashboard/widget";
import type {
  Notification,
  SecurityStatus as SecStatus,
  RebelRanking,
  WidgetData,
} from "@/types/dashboard";

/* ─────────── Layout helpers ─────────── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display tracking-wide text-foreground/85 flex items-center gap-2">
          <span className="inline-block size-1.5 rounded-full bg-primary/60" />
          {title}
        </h2>
        {description && (
          <p className="text-xs text-foreground/70 mt-1 ml-4">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Grid({
  cols = 3,
  children,
  className,
}: {
  cols?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const colMap: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        colMap[cols] || "md:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────── Glass primitives ─────────── */

function GlassCard({
  children,
  className,
  glow = "none",
}: {
  children: React.ReactNode;
  className?: string;
  glow?:
    | "none"
    | "indigo"
    | "emerald"
    | "rose"
    | "amber"
    | "cyan"
    | "violet"
    | (string & {});
}) {
  const glowStyles: Record<string, string> = {
    none: "",
    indigo:
      "shadow-indigo-500/10 hover:shadow-indigo-500/20 border-indigo-500/20 hover:border-indigo-500/30",
    emerald:
      "shadow-emerald-500/10 hover:shadow-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/30",
    rose: "shadow-rose-500/10 hover:shadow-rose-500/20 border-rose-500/20 hover:border-rose-500/30",
    amber:
      "shadow-amber-500/10 hover:shadow-amber-500/20 border-amber-500/20 hover:border-amber-500/30",
    cyan: "shadow-cyan-500/10 hover:shadow-cyan-500/20 border-cyan-500/20 hover:border-cyan-500/30",
    violet:
      "shadow-violet-500/10 hover:shadow-violet-500/20 border-violet-500/20 hover:border-violet-500/30",
  };

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 transition-all duration-300",
        glowStyles[glow] || "",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────── Stat cards (frost glass) ─────────── */

type FrostColor = "green" | "blue" | "orange" | "red";

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

function GlassStatCard({
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

/* ─────────── Feature cards ─────────── */

function GlassFeatureCard({
  icon: Icon,
  title,
  description,
  frost,
  tags,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  frost: FrostColor;
  tags?: string[];
}) {
  const t = statFrost[frost];
  return (
    <div className={cn("rounded-xl p-5 transition-all duration-300", t.card)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("size-10 rounded-lg flex items-center justify-center backdrop-blur-sm", t.iconBg)}>
          <Icon className={cn("size-5", t.iconText)} />
        </div>
        <div>
          <div className={cn("text-sm font-semibold", t.accent)}>{title}</div>
          <div className="text-[10px] text-foreground/65 uppercase tracking-wider">
            Feature
          </div>
        </div>
      </div>
      <p className="text-xs text-foreground/75 leading-relaxed mb-3">
        {description}
      </p>
      {tags && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "text-[9px] px-2 py-0.5 rounded-full border font-medium",
                t.badgeBg,
                t.badgeText,
                "border-current/20"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


/* ─────────── Experiment card (from /laboratory) ─────────── */

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "running" | "stopped" | "error";
  progress: number;
  lastRun: string;
  category: "ml" | "network" | "system";
  color: "green" | "red" | "orange" | "blue";
}

const demoExperiments: Experiment[] = [
  {
    id: "exp-1",
    name: "Neural Scan",
    description: "Pattern recognition & anomaly detection",
    status: "running",
    progress: 78,
    lastRun: "Now",
    category: "ml",
    color: "green",
  },
  {
    id: "exp-2",
    name: "Packet Analyzer",
    description: "Real-time network traffic analysis",
    status: "running",
    progress: 45,
    lastRun: "Now",
    category: "network",
    color: "blue",
  },
  {
    id: "exp-3",
    name: "Memory Weaver",
    description: "Distributed memory compression",
    status: "stopped",
    progress: 100,
    lastRun: "2h ago",
    category: "system",
    color: "orange",
  },
  {
    id: "exp-4",
    name: "Guardian AI",
    description: "Autonomous threat response",
    status: "stopped",
    progress: 62,
    lastRun: "5h ago",
    category: "ml",
    color: "orange",
  },
  {
    id: "exp-5",
    name: "Resource Optimizer",
    description: "Dynamic resource allocation engine",
    status: "error",
    progress: 89,
    lastRun: "Failed",
    category: "system",
    color: "red",
  },
];

/* Per-color token maps for card content styling */
const frostTokens: Record<
  Experiment["color"],
  {
    cardClass: string;
    accent: string;
    accentMuted: string;
    progressBar: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    iconBg: string;
    btnClass: string;
  }
> = {
  green: {
    cardClass: "glass-frost-green",
    accent: "text-emerald-400",
    accentMuted: "text-emerald-400/70",
    progressBar: "bg-emerald-500",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
    btnClass:
      "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
  },
  red: {
    cardClass: "glass-frost-red",
    accent: "text-red-400",
    accentMuted: "text-red-400/70",
    progressBar: "bg-red-500",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-300",
    badgeBorder: "border-red-500/30",
    iconBg: "bg-red-500/15",
    btnClass:
      "border border-red-500/30 bg-red-500/10 text-red-300 cursor-not-allowed opacity-60",
  },
  orange: {
    cardClass: "glass-frost-orange",
    accent: "text-orange-400",
    accentMuted: "text-orange-400/70",
    progressBar: "bg-orange-500",
    badgeBg: "bg-orange-500/15",
    badgeText: "text-orange-300",
    badgeBorder: "border-orange-500/30",
    iconBg: "bg-orange-500/15",
    btnClass:
      "border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20",
  },
  blue: {
    cardClass: "glass-frost-blue",
    accent: "text-blue-400",
    accentMuted: "text-blue-400/70",
    progressBar: "bg-blue-500",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-300",
    badgeBorder: "border-blue-500/30",
    iconBg: "bg-blue-500/15",
    btnClass:
      "border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
  },
};

function ExperimentCard({ exp }: { exp: Experiment }) {
  const t = frostTokens[exp.color];
  return (
    <div className={cn("rounded-xl p-4", t.cardClass)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bullet
            variant={
              exp.status === "running"
                ? "success"
                : exp.status === "error"
                ? "destructive"
                : "default"
            }
          />
          <span className="font-display text-sm tracking-wide">{exp.name}</span>
        </div>
        <span
          className={cn(
            "text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
            t.badgeBg,
            t.badgeText,
            t.badgeBorder
          )}
        >
          {exp.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-foreground/75 mb-4 leading-relaxed">
        {exp.description}
      </p>

      {/* Progress */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-foreground/65 uppercase tracking-wider">
            Progress
          </span>
          <span className={cn("font-mono font-bold tabular-nums", t.accent)}>
            {exp.progress}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
          <div
            className={cn("h-full rounded-full transition-all duration-700", t.progressBar)}
            style={{ width: `${exp.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-mono", t.accentMuted)}>
          {exp.lastRun}
        </span>
        <button
          className={cn(
            "h-6 px-3 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200",
            t.btnClass
          )}
          disabled={exp.status === "error"}
        >
          {exp.status === "running"
            ? "Stop"
            : exp.status === "error"
            ? "Failed"
            : "Start"}
        </button>
      </div>
    </div>
  );
}

/* ─────────── Demo data ─────────── */

const demoNotifications: Notification[] = [
  {
    id: "n1",
    title: "System Update",
    message: "ZES Core updated to v2.4.1",
    timestamp: "2m ago",
    type: "success",
    read: false,
    priority: "low",
  },
  {
    id: "n2",
    title: "Security Alert",
    message: "Unusual login detected from IP 192.168.1.100",
    timestamp: "15m ago",
    type: "warning",
    read: false,
    priority: "high",
  },
  {
    id: "n3",
    title: "Pipeline Failed",
    message: "Deployment pipeline #847 failed on staging",
    timestamp: "1h ago",
    type: "error",
    read: false,
    priority: "high",
  },
  {
    id: "n4",
    title: "Backup Complete",
    message: "Daily backup completed successfully (1.2 GB)",
    timestamp: "3h ago",
    type: "success",
    read: true,
    priority: "low",
  },
  {
    id: "n5",
    title: "Resource Warning",
    message: "CPU threshold exceeded on node-03 (87%)",
    timestamp: "5h ago",
    type: "warning",
    read: true,
    priority: "medium",
  },
];

const demoSecurityStatuses: SecStatus[] = [
  {
    title: "Firewall",
    value: "ACTIVE",
    status: "All ports filtered | 0 threats",
    variant: "success",
  },
  {
    title: "IDS/IPS",
    value: "ENABLED",
    status: "12,847 packets inspected | 3 alerts",
    variant: "success",
  },
  {
    title: "VPN Gateway",
    value: "CONNECTED",
    status: "9 tunnels active | 2.3 Gbps throughput",
    variant: "success",
  },
  {
    title: "Certificate",
    value: "VALID",
    status: "Expires in 187 days | Auto-renew enabled",
    variant: "success",
  },
  {
    title: "Access Control",
    value: "RESTRICTED",
    status: "24 users | 3 roles | 0 breaches",
    variant: "warning",
  },
];

const demoRebels: RebelRanking[] = [
  {
    id: 1,
    name: "Neo",
    handle: "@the_one",
    streak: "47-day streak",
    points: 12847,
    avatar: "",
    featured: true,
    subtitle: "Top Contributor",
  },
  {
    id: 2,
    name: "Trinity",
    handle: "@trinity",
    streak: "23-day streak",
    points: 9342,
    avatar: "",
    featured: false,
  },
  {
    id: 3,
    name: "Morpheus",
    handle: "@morpheus",
    streak: "12-day streak",
    points: 5612,
    avatar: "",
    featured: false,
  },
  {
    id: 4,
    name: "Switch",
    handle: "@switch",
    streak: "8-day streak",
    points: 2891,
    avatar: "",
    featured: false,
  },
  {
    id: 5,
    name: "Cypher",
    handle: "@cypher",
    streak: "3-day streak",
    points: 1024,
    avatar: "",
    featured: false,
  },
];

const demoWidgetData: WidgetData = {
  location: "Kuala Lumpur",
  timezone: "MYT",
  temperature: "32°C",
  weather: "Partly Cloudy",
  date: "2026-07-24",
};

/* ─────────── Page ─────────── */

export default function ShowcasePage() {
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Showcase",
        description: "Component library & glassmorphic design system",
        icon: Sparkles,
      }}
    >
      {/* ── 1. GLASS STAT CARDS ── */}
      <Section
        title="Glass Stat Cards"
        description="Compact metric cards with trend badges and icon slots."
      >
        <Grid cols={4}>
          <GlassStatCard
            label="Total Requests"
            value="1,234,567"
            change="+12.5%"
            icon={Activity}
            frost="green"
            trend="up"
          />
          <GlassStatCard
            label="Active Users"
            value="892"
            change="+5.2%"
            icon={User}
            frost="blue"
            trend="up"
          />
          <GlassStatCard
            label="Avg Response"
            value="42ms"
            change="+2.1%"
            icon={Cpu}
            frost="orange"
            trend="down"
          />
          <GlassStatCard
            label="Errors"
            value="7"
            change="-18.3%"
            icon={AlertTriangle}
            frost="red"
            trend="up"
          />
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 2. ANIMATED STAT CARDS ── */}
      <Section
        title="Animated Stat Cards"
        description={`Full-featured stat cards with NumberFlow animation and directional marquees — from components/dashboard/stat.`}
      >
        <Grid cols={3}>
          <DashboardStat
            label="Issues Completed"
            value="49"
            description="Weekly scope"
            icon={Check}
            intent="positive"
            direction="up"
            tag="+12%"
          />
          <DashboardStat
            label="Minutes Lost"
            value="642"
            description="In meetings & rabbit holes"
            icon={AlertTriangle}
            intent="negative"
            direction="down"
          />
          <DashboardStat
            label="Accidents"
            value="0"
            description="The client is always right"
            icon={Shield}
            intent="neutral"
            tag="4 weeks"
          />
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 3. FEATURE CARDS ── */}
      <Section
        title="Feature Cards"
        description="Descriptive cards with icon, body copy, and tag pills."
      >
        <Grid cols={3}>
          <GlassFeatureCard
            icon={Zap}
            title="Performance"
            description="Real-time metrics with sub-millisecond latency. Optimized for high-throughput data processing pipelines."
            frost="green"
            tags={["low-latency", "high-throughput", "real-time"]}
          />
          <GlassFeatureCard
            icon={Shield}
            title="Security"
            description="Zero-trust architecture with end-to-end encryption. SOC 2 compliant with automated threat detection."
            frost="blue"
            tags={["zero-trust", "encrypted", "compliant"]}
          />
          <GlassFeatureCard
            icon={Heart}
            title="Reliability"
            description="99.99% uptime SLA with automatic failover. Distributed across multiple availability zones."
            frost="red"
            tags={["high-availability", "fault-tolerant", "backup"]}
          />
          <GlassFeatureCard
            icon={Cloud}
            title="Cloud Native"
            description="Fully containerized deployment on Kubernetes. Auto-scaling based on demand with zero downtime."
            frost="orange"
            tags={["kubernetes", "docker", "serverless"]}
          />
          <GlassFeatureCard
            icon={Database}
            title="Data Layer"
            description="Distributed database with multi-region replication. ACID compliant with eventual consistency options."
            frost="green"
            tags={["postgresql", "redis", "cassandra"]}
          />
          <GlassFeatureCard
            icon={Share2}
            title="API Gateway"
            description="Unified API gateway with rate limiting, auth, and monitoring. GraphQL and REST endpoints supported."
            frost="blue"
            tags={["graphql", "rest", "websocket"]}
          />
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 4. GLASS BUTTONS ── */}
      <Section
        title="Glass Buttons"
        description="Interactive glass button variants with hover lift effects."
      >
        <GlassCard>
          <div className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-foreground/65 mb-3">
                Sizes
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="glass-btn px-5 py-2.5 rounded-lg text-sm font-medium text-foreground/85">
                  Large
                </button>
                <button className="glass-btn px-4 py-2 rounded-lg text-xs font-medium text-foreground/85">
                  Default Glass
                </button>
                <button className="glass-btn-primary px-4 py-2 rounded-lg text-xs font-medium text-white">
                  Primary Action
                </button>
                <button className="glass-btn-success px-4 py-2 rounded-lg text-xs font-medium text-white">
                  Success
                </button>
                <button className="glass-btn-destructive px-4 py-2 rounded-lg text-xs font-medium text-white">
                  Destructive
                </button>
                <button
                  className="glass-btn px-4 py-2 rounded-lg text-xs font-medium text-foreground/70"
                  disabled
                >
                  Disabled
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-foreground/65 mb-3">
                With Icons
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="glass-btn px-3 py-1.5 rounded-lg text-[10px] font-medium text-foreground/85 flex items-center gap-1.5">
                  <Eye className="size-3" /> View
                </button>
                <button className="glass-btn-primary px-3 py-1.5 rounded-lg text-[10px] font-medium text-white flex items-center gap-1.5">
                  <Play className="size-3" /> Deploy
                </button>
                <button className="glass-btn-success px-3 py-1.5 rounded-lg text-[10px] font-medium text-white flex items-center gap-1.5">
                  <Save className="size-3" /> Save
                </button>
                <button
                  onClick={handleCopy}
                  className="glass-btn px-3 py-1.5 rounded-lg text-[10px] font-medium text-foreground/85 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 5. GLASS BADGES ── */}
      <Section
        title="Glass Badges"
        description="Pill badges with glass background — all color variants."
      >
        <GlassCard>
          <div className="flex flex-wrap gap-2">
            <span className="glass-badge text-xs">Default</span>
            <span className="glass-badge text-xs bg-indigo-500/15 border-indigo-500/20 text-indigo-300">
              Indigo
            </span>
            <span className="glass-badge text-xs bg-emerald-500/15 border-emerald-500/20 text-emerald-300">
              Emerald
            </span>
            <span className="glass-badge text-xs bg-rose-500/15 border-rose-500/20 text-rose-300">
              Rose
            </span>
            <span className="glass-badge text-xs bg-amber-500/15 border-amber-500/20 text-amber-300">
              Amber
            </span>
            <span className="glass-badge text-xs bg-cyan-500/15 border-cyan-500/20 text-cyan-300">
              Cyan
            </span>
            <span className="glass-badge text-xs bg-violet-500/15 border-violet-500/20 text-violet-300">
              Violet
            </span>
            <span className="glass-badge text-xs bg-white/15 border-white/20">
              White
            </span>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 6. GLASS INPUTS ── */}
      <Section
        title="Glass Inputs"
        description="Text input and textarea with glass styling and focus ring."
      >
        <GlassCard>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-foreground/70 font-medium">
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="glass-input w-full rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/70 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-foreground/70 font-medium">
                  With Icon
                </label>
                <div className="relative">
                  <Mail className="size-3 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="glass-input w-full rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/70 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-foreground/70 font-medium">
                Textarea
              </label>
              <textarea
                placeholder="Write something..."
                rows={3}
                className="glass-input w-full rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/70 outline-none resize-none"
              />
            </div>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 7. CARD VARIANTS ── */}
      <Section
        title="Card Variants"
        description="Frost glass cards — green, blue, orange, red — demonstrating different content patterns."
      >
        <Grid cols={2}>
          {/* Green — progress */}
          <div className="glass-frost-green rounded-xl p-5 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Database className="size-6 text-emerald-400" />
              </div>
              <div>
                <div className="font-display text-base text-emerald-300">Frost Green</div>
                <div className="text-[10px] text-foreground/65">
                  backdrop-blur(20px)
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
              <div className="w-3/4 h-full bg-emerald-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/65">Progress</span>
              <span className="font-mono text-emerald-300 font-bold">75%</span>
            </div>
          </div>

          {/* Blue — status */}
          <div className="glass-frost-blue rounded-xl p-5 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Activity className="size-6 text-blue-400" />
              </div>
              <div>
                <div className="font-display text-base text-blue-300">Frost Blue</div>
                <div className="text-[10px] text-foreground/65">
                  backdrop-blur(20px)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="size-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs text-blue-300">System operational</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-foreground/65">
              <span>Uptime: 99.99%</span>
              <span>·</span>
              <span>Latency: 12ms</span>
            </div>
          </div>

          {/* Orange — alert */}
          <div className="glass-frost-orange rounded-xl p-5 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Bell className="size-6 text-orange-400" />
              </div>
              <div>
                <div className="font-display text-base text-orange-300">Frost Orange</div>
                <div className="text-[10px] text-foreground/65">
                  Warning variant
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/25">
              <AlertTriangle className="size-3 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-200/80">
                CPU threshold exceeded on node-03 at 87% capacity. Consider scaling up.
              </p>
            </div>
          </div>

          {/* Red — config */}
          <div className="glass-frost-red rounded-xl p-5 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                <Settings className="size-6 text-red-400" />
              </div>
              <div>
                <div className="font-display text-base text-red-300">Frost Red</div>
                <div className="text-[10px] text-foreground/65">
                  Error variant
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Auto Deploy", ok: false },
                { label: "Notifications", ok: true },
                { label: "Backup", ok: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-xs text-foreground/60">{item.label}</span>
                  <div
                    className={cn(
                      "size-4 rounded-sm border flex items-center justify-center",
                      item.ok
                        ? "bg-emerald-400/25 border-emerald-400/40"
                        : "bg-red-400/20 border-red-400/35"
                    )}
                  >
                    {item.ok ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-red-400 block" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 8. EXPERIMENT CARDS ── */}
      <Section
        title="Experiment Cards"
        description="Frost glassmorphic color cards — green (running), blue (network), orange (stopped), red (error). Used in /laboratory."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoExperiments.map((exp) => (
            <ExperimentCard key={exp.id} exp={exp} />
          ))}
        </div>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 9. SYSTEM MONITOR PANELS ── */}
      <Section
        title="System Monitor Panels"
        description="Frost glassmorphic monitor panels — green, blue, orange, red — with Bullet indicators and progress bars."
      >
        <Grid cols={4}>
          {/* Green — CPU */}
          <div className="glass-frost-green rounded-xl p-4 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300/70 font-semibold">
                CPU
              </span>
              <Bullet variant="success" />
            </div>
            <div className="text-2xl font-display font-bold text-emerald-300 mb-0.5">2.1</div>
            <div className="text-[10px] text-foreground/65 font-mono mb-3">load average</div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: "26%" }} />
            </div>
          </div>

          {/* Blue — Memory */}
          <div className="glass-frost-blue rounded-xl p-4 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">
                Memory
              </span>
              <Bullet variant="success" />
            </div>
            <div className="text-2xl font-display font-bold text-blue-300 mb-0.5">4.2 GB</div>
            <div className="text-[10px] text-foreground/65 font-mono mb-3">of 8.0 GB total</div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: "52%" }} />
            </div>
          </div>

          {/* Orange — Disk */}
          <div className="glass-frost-orange rounded-xl p-4 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-orange-300/70 font-semibold">
                Disk
              </span>
              <Bullet variant="warning" />
            </div>
            <div className="text-2xl font-display font-bold text-orange-300 mb-0.5">187 GB</div>
            <div className="text-[10px] text-foreground/65 font-mono mb-3">of 256 GB total</div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: "73%" }} />
            </div>
          </div>

          {/* Red — Network */}
          <div className="glass-frost-red rounded-xl p-4 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-red-300/70 font-semibold">
                Network
              </span>
              <Bullet variant="destructive" />
            </div>
            <div className="text-2xl font-display font-bold text-red-300 mb-0.5">98%</div>
            <div className="text-[10px] text-foreground/65 font-mono mb-3">bandwidth used</div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: "98%" }} />
            </div>
          </div>
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 10. WIDGET (TV Noise Clock) ── */}
      <Section
        title="Widget — TV Noise Clock"
        description="Fullscreen clock widget with animated TV noise overlay — from components/dashboard/widget."
      >
        <div className="max-w-sm mx-auto">
          <Widget widgetData={demoWidgetData} />
        </div>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 11. SECURITY STATUS ── */}
      <Section
        title="Security Status Panel"
        description="Security monitoring panel with variant-colored status items — from components/dashboard/security-status."
      >
        <SecurityStatus statuses={demoSecurityStatuses} />
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 12. REBELS RANKING ── */}
      <Section
        title="Rebels Ranking List"
        description="Leaderboard-style ranking with avatars, streaks, and points — from components/dashboard/rebels-ranking."
      >
        <RebelsRanking rebels={demoRebels} />
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 13. NOTIFICATIONS ── */}
      <Section
        title="Notifications Panel"
        description="Animated notification list with mark-as-read, delete, and clear-all — from components/dashboard/notifications."
      >
        <div className="max-w-md mx-auto">
          <NotificationsWidget initialNotifications={demoNotifications} />
        </div>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 14. DASHBOARD CHART ── */}
      <Section
        title="Dashboard Chart (Recharts)"
        description="Interactive area chart with week/month/year tabs — from components/dashboard/chart."
      >
        <DashboardChart />
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 15. COLOR PALETTE ── */}
      <Section
        title="Frost Glass Palette"
        description="Four frost glassmorphic color tokens — each a standalone showcase tile."
      >
        <Grid cols={4}>
          <div className="glass-frost-green rounded-xl p-4">
            <div className="size-10 rounded-lg bg-emerald-500/20 mb-3" />
            <div className="text-xs font-semibold text-emerald-300 mb-0.5">Frost Green</div>
            <div className="font-mono text-[10px] text-foreground/65">.glass-frost-green</div>
            <div className="mt-3 h-1 rounded-full bg-emerald-500/30 overflow-hidden">
              <div className="h-full w-4/5 bg-emerald-500 rounded-full" />
            </div>
          </div>
          <div className="glass-frost-blue rounded-xl p-4">
            <div className="size-10 rounded-lg bg-blue-500/20 mb-3" />
            <div className="text-xs font-semibold text-blue-300 mb-0.5">Frost Blue</div>
            <div className="font-mono text-[10px] text-foreground/65">.glass-frost-blue</div>
            <div className="mt-3 h-1 rounded-full bg-blue-500/30 overflow-hidden">
              <div className="h-full w-3/5 bg-blue-500 rounded-full" />
            </div>
          </div>
          <div className="glass-frost-orange rounded-xl p-4">
            <div className="size-10 rounded-lg bg-orange-500/20 mb-3" />
            <div className="text-xs font-semibold text-orange-300 mb-0.5">Frost Orange</div>
            <div className="font-mono text-[10px] text-foreground/65">.glass-frost-orange</div>
            <div className="mt-3 h-1 rounded-full bg-orange-500/30 overflow-hidden">
              <div className="h-full w-2/3 bg-orange-500 rounded-full" />
            </div>
          </div>
          <div className="glass-frost-red rounded-xl p-4">
            <div className="size-10 rounded-lg bg-red-500/20 mb-3" />
            <div className="text-xs font-semibold text-red-300 mb-0.5">Frost Red</div>
            <div className="font-mono text-[10px] text-foreground/65">.glass-frost-red</div>
            <div className="mt-3 h-1 rounded-full bg-red-500/30 overflow-hidden">
              <div className="h-full w-1/3 bg-red-500 rounded-full" />
            </div>
          </div>
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 16. CSS CLASSES REFERENCE ── */}
      <Section
        title="CSS Classes Reference"
        description="All glass utility classes defined in globals.css."
      >
        <GlassCard>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-[11px] space-y-1.5 text-foreground/60">
            <div>
              <span className="text-indigo-400">.glass</span>
              {" {background: rgba(255,255,255,0.06); backdrop-filter: blur(12px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-strong</span>
              {" {background: rgba(255,255,255,0.12); backdrop-filter: blur(16px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-card</span>
              {" {background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-btn</span>
              {" {background: rgba(255,255,255,0.07); backdrop-filter: blur(8px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-btn-primary</span>
              {" {gradient indigo→violet; backdrop-filter: blur(8px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-btn-success</span>
              {" {gradient emerald→teal; backdrop-filter: blur(8px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-btn-destructive</span>
              {" {gradient rose→red; backdrop-filter: blur(8px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-badge</span>
              {" {background: rgba(255,255,255,0.08); backdrop-filter: blur(4px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-input</span>
              {" {background: rgba(255,255,255,0.05); backdrop-filter: blur(8px);}"}
            </div>
            <div>
              <span className="text-indigo-400">.glass-divider</span>
              {" {gradient transparent→white/10→transparent}"}
            </div>
          </div>
          <p className="text-xs text-foreground/70 mt-4">
            Combine with{" "}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
              glow=&quot;indigo&quot; | &quot;emerald&quot; | &quot;rose&quot; | &quot;amber&quot;
            </code>{" "}
            on GlassCard for accent borders and shadows.
          </p>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── 17. EXTERNAL LINKS ── */}
      <Section
        title="External Resources"
        description="Project documentation and reference pages."
      >
        <Grid cols={2}>
          <a
            href="https://app.notion.com/p/Claude-Dashboard-a8e881eceb328360b52c8170fd7e7682"
            target="_blank"
            rel="noopener noreferrer"
            className="group block h-full"
          >
            <div className="glass-frost-green rounded-xl p-5 h-full transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center transition-colors group-hover:bg-emerald-500/25">
                  <Book className="size-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-emerald-300">
                    Claude Dashboard
                  </div>
                  <div className="text-[10px] text-foreground/65 uppercase tracking-wider">
                    Notion Page
                  </div>
                </div>
              </div>
              <p className="text-xs text-foreground/75 leading-relaxed">
                ZES Claude Dashboard — project overview, agent integration guide, and system architecture documentation.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-400/60 group-hover:text-emerald-400 transition-colors">
                <span>Open page</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </a>

          <a
            href="https://app.notion.com/p/Claude-Dashboard-a8e881eceb328360b52c8170fd7e7682"
            target="_blank"
            rel="noopener noreferrer"
            className="group block h-full"
          >
            <div className="glass-frost-blue rounded-xl p-5 h-full transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-blue-500/15 flex items-center justify-center transition-colors group-hover:bg-blue-500/25">
                  <Share2 className="size-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-300">
                    System Docs
                  </div>
                  <div className="text-[10px] text-foreground/65 uppercase tracking-wider">
                    Notion Wiki
                  </div>
                </div>
              </div>
              <p className="text-xs text-foreground/75 leading-relaxed">
                ZES orchestration system documentation — agent workflow guides, architecture decisions, and deployment runbooks.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-blue-400/60 group-hover:text-blue-400 transition-colors">
                <span>Open page</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </a>
        </Grid>
      </Section>
    </DashboardPageLayout>
  );
}
