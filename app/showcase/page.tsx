"use client";

import React, { useState } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sparkles, Zap, Shield, Eye, Play, Save, Copy,
  Check, X, AlertTriangle, Info, ArrowRight,
  Github, Twitter, Mail, Heart, Code, Palette,
  Layers, Box, Activity, Cpu, Globe, Lock,
  Bell, Settings, User, Star, RefreshCw,
  CreditCard, BarChart3, Cloud, Database,
  Share2, Terminal, Wifi, Book,
} from "lucide-react";
import { Bullet } from "@/components/ui/bullet";
import BracketsIcon from "@/components/icons/brackets";
import DashboardStat from "@/components/dashboard/stat";
import DashboardChart from "@/components/dashboard/chart";
import SecurityStatus from "@/components/dashboard/security-status";
import RebelsRanking from "@/components/dashboard/rebels-ranking";
import NotificationsWidget from "@/components/dashboard/notifications";
import Widget from "@/components/dashboard/widget";
import type { Notification, SecurityStatus as SecStatus, RebelRanking, WidgetData } from "@/types/dashboard";

/* ────────────── Glass Card Component ────────────── */

function GlassCard({
  children,
  className,
  glow = "none",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: "none" | "indigo" | "emerald" | "rose" | "amber" | "cyan" | "violet" | (string & {});
}) {
  const glowStyles: Record<string, string> = {
    none: "",
    indigo: "shadow-indigo-500/10 hover:shadow-indigo-500/20 border-indigo-500/20 hover:border-indigo-500/30",
    emerald: "shadow-emerald-500/10 hover:shadow-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/30",
    rose: "shadow-rose-500/10 hover:shadow-rose-500/20 border-rose-500/20 hover:border-rose-500/30",
    amber: "shadow-amber-500/10 hover:shadow-amber-500/20 border-amber-500/20 hover:border-amber-500/30",
    cyan: "shadow-cyan-500/10 hover:shadow-cyan-500/20 border-cyan-500/20 hover:border-cyan-500/30",
    violet: "shadow-violet-500/10 hover:shadow-violet-500/20 border-violet-500/20 hover:border-violet-500/30",
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

/* ────────────── Section Wrapper ────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display tracking-wide text-foreground/80 flex items-center gap-2">
        <span className="inline-block size-1.5 rounded-full bg-primary/60" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Grid({ cols = 3, children }: { cols?: number; children: React.ReactNode }) {
  const colMap: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };
  return (
    <div className={cn("grid grid-cols-1 gap-4", colMap[cols] || "md:grid-cols-3")}>
      {children}
    </div>
  );
}

/* ────────────── Color swatch ────────────── */

function ColorSwatch({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("size-8 rounded-lg border border-white/10", colorClass)} />
      <span className="text-xs font-mono text-foreground/60">{label}</span>
    </div>
  );
}

/* ────────────── Stat Card ────────────── */

function GlassStatCard({
  label,
  value,
  change,
  icon: Icon,
  glow,
  trend = "up",
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  glow: string;
  trend?: "up" | "down";
}) {
  return (
    <GlassCard glow={glow}>
      <div className="flex items-start justify-between mb-3">
        <div className="size-9 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
          <Icon className="size-4 text-foreground/70" />
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] border-0",
            trend === "up" ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
          )}
        >
          <ArrowRight
            className={cn("size-3 mr-0.5", trend === "up" ? "rotate-[-90deg]" : "rotate-90")}
          />
          {change}
        </Badge>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold mb-0.5">
        {label}
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
    </GlassCard>
  );
}

/* ────────────── Feature Card ────────────── */

function GlassFeatureCard({
  icon: Icon,
  title,
  description,
  glow,
  tags,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  glow: string;
  tags?: string[];
}) {
  return (
    <GlassCard glow={glow}>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
          <Icon className="size-5 text-foreground/70" />
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Feature</div>
        </div>
      </div>
      <p className="text-xs text-foreground/60 leading-relaxed mb-3">
        {description}
      </p>
      {tags && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="glass-badge text-[9px] px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

/* ────────────── Page ────────────── */


/* ────────────── Laboratory-style Experiment Card ────────────── */

interface Experiment {
  id: string; name: string; description: string;
  status: "running" | "stopped" | "error";
  progress: number; lastRun: string; category: string;
}

const demoExperiments: Experiment[] = [
  { id: "exp-1", name: "Neural Scan", description: "Pattern recognition & anomaly detection", status: "running", progress: 78, lastRun: "Now", category: "ml" },
  { id: "exp-2", name: "Packet Analyzer", description: "Real-time network traffic analysis", status: "running", progress: 45, lastRun: "Now", category: "network" },
  { id: "exp-3", name: "Memory Weaver", description: "Distributed memory compression", status: "stopped", progress: 100, lastRun: "2h ago", category: "system" },
  { id: "exp-4", name: "Guardian AI", description: "Autonomous threat response", status: "stopped", progress: 62, lastRun: "5h ago", category: "ml" },
  { id: "exp-5", name: "Resource Optimizer", description: "Dynamic resource allocation engine", status: "error", progress: 89, lastRun: "Failed", category: "system" },
];

const demoCategoryColors: Record<string, string> = {
  ml: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  network: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  system: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

/* ────────────── Demo data for showcase components ────────────── */

const demoNotifications: Notification[] = [
  { id: "n1", title: "System Update", message: "ZES Core updated to v2.4.1", timestamp: "2m ago", type: "success", read: false, priority: "low" },
  { id: "n2", title: "Security Alert", message: "Unusual login detected from IP 192.168.1.100", timestamp: "15m ago", type: "warning", read: false, priority: "high" },
  { id: "n3", title: "Pipeline Failed", message: "Deployment pipeline #847 failed on staging", timestamp: "1h ago", type: "error", read: false, priority: "high" },
  { id: "n4", title: "Backup Complete", message: "Daily backup completed successfully (1.2GB)", timestamp: "3h ago", type: "success", read: true, priority: "low" },
  { id: "n5", title: "Resource Warning", message: "CPU threshold exceeded on node-03 (87%)", timestamp: "5h ago", type: "warning", read: true, priority: "medium" },
];

const demoSecurityStatuses: SecStatus[] = [
  { title: "Firewall", value: "ACTIVE", status: "All ports filtered | 0 threats", variant: "success" },
  { title: "IDS/IPS", value: "ENABLED", status: "12,847 packets inspected | 3 alerts", variant: "success" },
  { title: "VPN Gateway", value: "CONNECTED", status: "9 tunnels active | 2.3 Gbps throughput", variant: "success" },
  { title: "Certificate", value: "VALID", status: "Expires in 187 days | Auto-renew enabled", variant: "success" },
  { title: "Access Control", value: "RESTRICTED", status: "24 users | 3 roles | 0 breaches", variant: "warning" },
];

const demoRebels: RebelRanking[] = [
  { id: 1, name: "Neo", handle: "@the_one", streak: "47-day streak", points: 12847, avatar: "", featured: true, subtitle: "Top Contributor" },
  { id: 2, name: "Trinity", handle: "@trinity", streak: "23-day streak", points: 9342, avatar: "", featured: false },
  { id: 3, name: "Morpheus", handle: "@morpheus", streak: "12-day streak", points: 5612, avatar: "", featured: false },
  { id: 4, name: "Switch", handle: "@switch", streak: "8-day streak", points: 2891, avatar: "", featured: false },
  { id: 5, name: "Cypher", handle: "@cypher", streak: "3-day streak", points: 1024, avatar: "", featured: false },
];

const demoWidgetData: WidgetData = {
  location: "Kuala Lumpur",
  timezone: "MYT",
  temperature: "32°C",
  weather: "Partly Cloudy",
  date: "2026-07-22",
};

function ExperimentCard({ exp }: { exp: Experiment }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-300 hover:border-primary/30",
        exp.status === "running"
          ? "border-success/30 bg-success/5"
          : exp.status === "error"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border/40 bg-accent/10"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bullet
            variant={exp.status === "running" ? "success" : exp.status === "error" ? "destructive" : "default"}
          />
          <span className="font-display text-sm">{exp.name}</span>
        </div>
        <Badge variant="outline" className={cn("text-[9px] uppercase", demoCategoryColors[exp.category])}>
          {exp.category}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{exp.description}</p>
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Progress</span>
          <span className={cn(
            "font-mono font-bold",
            exp.status === "running" ? "text-success" : exp.status === "error" ? "text-destructive" : "text-muted-foreground"
          )}>{exp.progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              exp.status === "running" ? "bg-success" : exp.status === "error" ? "bg-destructive" : "bg-muted-foreground/30"
            )}
            style={{ width: `${exp.progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">Last: {exp.lastRun}</span>
        <Button
          variant={exp.status === "running" ? "outline" : "default"}
          size="sm"
          className="h-6 text-[10px] px-2"
          disabled={exp.status === "error"}
        >
          {exp.status === "running" ? "STOP" : exp.status === "error" ? "FAILED" : "START"}
        </Button>
      </div>
    </div>
  );
}

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
        title: "ZES Dashboard",
        description: "System overview, components & external resources",
        icon: Sparkles,
      }}
    >
      {/* ── GLASS STAT CARDS ── */}
      <Section title="Stat Cards">
        <Grid cols={4}>
          <GlassStatCard
            label="Total Requests"
            value="1,234,567"
            change="+12.5%"
            icon={Activity}
            glow="indigo"
            trend="up"
          />
          <GlassStatCard
            label="Active Users"
            value="892"
            change="+5.2%"
            icon={User}
            glow="emerald"
            trend="up"
          />
          <GlassStatCard
            label="Avg Response"
            value="42ms"
            change="+2.1%"
            icon={Cpu}
            glow="amber"
            trend="down"
          />
          <GlassStatCard
            label="Errors"
            value="7"
            change="-18.3%"
            icon={AlertTriangle}
            glow="rose"
            trend="up"
          />
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── FEATURE CARDS ── */}
      <Section title="Feature Cards">
        <Grid cols={3}>
          <GlassFeatureCard
            icon={Zap}
            title="Performance"
            description="Real-time metrics with sub-millisecond latency. Optimized for high-throughput data processing pipelines."
            glow="indigo"
            tags={["low-latency", "high-throughput", "real-time"]}
          />
          <GlassFeatureCard
            icon={Shield}
            title="Security"
            description="Zero-trust architecture with end-to-end encryption. SOC 2 compliant with automated threat detection."
            glow="emerald"
            tags={["zero-trust", "encrypted", "compliant"]}
          />
          <GlassFeatureCard
            icon={Heart}
            title="Reliability"
            description="99.99% uptime SLA with automatic failover. Distributed across multiple availability zones."
            glow="rose"
            tags={["high-availability", "fault-tolerant", "backup"]}
          />
          <GlassFeatureCard
            icon={Cloud}
            title="Cloud Native"
            description="Fully containerized deployment on Kubernetes. Auto-scaling based on demand with zero downtime."
            glow="cyan"
            tags={["kubernetes", "docker", "serverless"]}
          />
          <GlassFeatureCard
            icon={Database}
            title="Data Layer"
            description="Distributed database with multi-region replication. ACID compliant with eventual consistency options."
            glow="violet"
            tags={["postgresql", "redis", "cassandra"]}
          />
          <GlassFeatureCard
            icon={Share2}
            title="API Gateway"
            description="Unified API gateway with rate limiting, auth, and monitoring. GraphQL and REST endpoints supported."
            glow="amber"
            tags={["graphql", "rest", "websocket"]}
          />
        </Grid>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── GLASS BUTTONS ── */}
      <Section title="Glass Buttons">
        <GlassCard>
          <div className="space-y-4">
            <p className="text-xs text-foreground/60">Interactive glass buttons with hover effects</p>
            <div className="flex flex-wrap gap-3">
              <button className="glass-btn px-4 py-2 rounded-lg text-xs font-medium text-foreground/80">
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
              <button className="glass-btn px-4 py-2 rounded-lg text-xs font-medium text-foreground/80" disabled>
                Disabled
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="glass-btn px-3 py-1.5 rounded-lg text-[10px] font-medium text-foreground/80 flex items-center gap-1.5">
                <Eye className="size-3" /> View
              </button>
              <button className="glass-btn-primary px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                <Play className="size-3" /> Deploy
              </button>
              <button className="glass-btn-success px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                <Save className="size-3" /> Save
              </button>
              <button
                onClick={handleCopy}
                className="glass-btn px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5"
              >
                {copied ? (
                  <><Check className="size-3 text-emerald-400" /> Copied</>
                ) : (
                  <><Copy className="size-3" /> Copy</>
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── GLASS BADGES ── */}
      <Section title="Glass Badges">
        <GlassCard>
          <div className="flex flex-wrap gap-2">
            <span className="glass-badge text-xs">Default</span>
            <span className="glass-badge text-xs bg-indigo-500/15 border-indigo-500/20 text-indigo-300">Indigo</span>
            <span className="glass-badge text-xs bg-emerald-500/15 border-emerald-500/20 text-emerald-300">Emerald</span>
            <span className="glass-badge text-xs bg-rose-500/15 border-rose-500/20 text-rose-300">Rose</span>
            <span className="glass-badge text-xs bg-amber-500/15 border-amber-500/20 text-amber-300">Amber</span>
            <span className="glass-badge text-xs bg-cyan-500/15 border-cyan-500/20 text-cyan-300">Cyan</span>
            <span className="glass-badge text-xs bg-violet-500/15 border-violet-500/20 text-violet-300">Violet</span>
            <span className="glass-badge text-xs bg-white/15 border-white/20">White</span>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── GLASS INPUTS ── */}
      <Section title="Glass Inputs">
        <GlassCard>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-foreground/50 font-medium">
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="glass-input w-full rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-foreground/50 font-medium">
                  With Icon
                </label>
                <div className="relative">
                  <Mail className="size-3 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="glass-input w-full rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/30 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-foreground/50 font-medium">
                Textarea
              </label>
              <textarea
                placeholder="Write something..."
                rows={3}
                className="glass-input w-full rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 outline-none resize-none"
              />
            </div>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── CARD VARIANTS ── */}
      <Section title="Card Variants">
        <Grid cols={2}>
          <GlassCard glow="indigo">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                <Box className="size-6 text-indigo-400" />
              </div>
              <div>
                <div className="font-display text-base">Glass Default</div>
                <div className="text-[10px] text-foreground/50">backdrop-blur(20px)</div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
              <div className="w-3/4 h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/50">Progress</span>
              <span className="font-mono text-indigo-300">75%</span>
            </div>
          </GlassCard>

          <GlassCard glow="emerald">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <Activity className="size-6 text-emerald-400" />
              </div>
              <div>
                <div className="font-display text-base">Glass Strong</div>
                <div className="text-[10px] text-foreground/50">backdrop-blur(16px)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300">System operational</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-foreground/50">
              <span>Uptime: 99.99%</span>
              <span>·</span>
              <span>Latency: 12ms</span>
            </div>
          </GlassCard>

          <GlassCard glow="rose">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center">
                <Bell className="size-6 text-rose-400" />
              </div>
              <div>
                <div className="font-display text-base">Glass Alert</div>
                <div className="text-[10px] text-foreground/50">Warning variant</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="size-3 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-200/80">
                Database connection pool is at 85% capacity. Consider scaling up.
              </p>
            </div>
          </GlassCard>

          <GlassCard glow="amber">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                <Settings className="size-6 text-amber-400" />
              </div>
              <div>
                <div className="font-display text-base">Glass Config</div>
                <div className="text-[10px] text-foreground/50">Settings panel</div>
              </div>
            </div>
            <div className="space-y-2">
              {["Auto Deploy", "Notifications", "Backup"].map((item) => (
                <div key={item} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-foreground/70">{item}</span>
                  <div className="size-4 rounded-sm bg-emerald-400/30 border border-emerald-400/50 flex items-center justify-center">
                    <Check className="size-3 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </Grid>
      </Section>

      
      <hr className="glass-divider my-8" />

      {/* ── EXPERIMENT CARDS (from /laboratory) ── */}
      <Section title="Experiment Cards">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Status-colored cards with progress bars, category badges, and action buttons — copied from the Laboratory page.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoExperiments.map((exp) => (
            <ExperimentCard key={exp.id} exp={exp} />
          ))}
        </div>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── SYSTEM MONITOR PANELS (from /laboratory) ── */}
      <Section title="System Monitor Panels">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Compact monitoring cards with Bullet status indicators and progress bars — copied from the Laboratory page.
        </p>
        <GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">CPU</span>
                <Bullet variant="success" />
              </div>
              <div className="text-2xl font-display font-bold mb-1">2.1</div>
              <div className="text-[10px] text-muted-foreground font-mono">load average</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">MEMORY</span>
                <Bullet variant="success" />
              </div>
              <div className="text-2xl font-display font-bold mb-1">4.2 GB</div>
              <div className="text-[10px] text-muted-foreground font-mono">of 8.0 GB total</div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: "52%" }} />
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">DISK</span>
                <Bullet variant="warning" />
              </div>
              <div className="text-2xl font-display font-bold mb-1">187 GB</div>
              <div className="text-[10px] text-muted-foreground font-mono">of 256 GB total</div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-warning transition-all duration-500" style={{ width: "73%" }} />
              </div>
            </div>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── DASHBOARDCARD COMPONENT ── */}
      <Section title="DashboardCard Component">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          The reusable wrapper used throughout the dashboard — combines Card + CardHeader + Bullet + CardContent.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Bullet variant="success" />
              <span className="font-display text-sm font-medium">ACTIVE EXPERIMENTS</span>
              <div className="ml-auto">
                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">LIVE</Badge>
              </div>
            </div>
            <div className="text-xs text-foreground/70">5 experiments running</div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Bullet variant="default" />
              <span className="font-display text-sm font-medium">RESEARCH LOG</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-muted-foreground w-8 shrink-0">09:14</span>
              <Bullet variant="success" className="mt-0.5 shrink-0" />
              <span className="text-xs">Neural Mesh reached checkpoint 3/4</span>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Animated Stat Cards (DashboardStat)">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Full-featured stat cards with NumberFlow animation, direction marquees, and Icon — from <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">components/dashboard/stat</code>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardStat label="Issues Completed" value="49" description="Weekly scope" icon={Check} intent="positive" direction="up" tag="+12%" />
          <DashboardStat label="Minutes Lost" value="642" description="In meetings & rabbit holes" icon={AlertTriangle} intent="negative" direction="down" />
          <DashboardStat label="Accidents" value="0" description="The client is always right" icon={Shield} intent="neutral" tag="4 weeks 🔥" />
        </div>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── WIDGET (TV Noise Clock) ── */}
      <Section title="Widget (TV Noise Clock)">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Fullscreen clock widget with animated TV noise overlay — from <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">components/dashboard/widget</code>.
        </p>
        <div className="max-w-sm mx-auto">
          <Widget widgetData={demoWidgetData} />
        </div>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── SECURITY STATUS ── */}
      <Section title="Security Status Panel">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Security monitoring panel with variant-colored status items — from <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">components/dashboard/security-status</code>.
        </p>
        <SecurityStatus statuses={demoSecurityStatuses} />
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── REBELS RANKING ── */}
      <Section title="Rebels Ranking List">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Leaderboard-style ranking with avatars, streaks, and points — from <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">components/dashboard/rebels-ranking</code>.
        </p>
        <RebelsRanking rebels={demoRebels} />
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── NOTIFICATIONS ── */}
      <Section title="Notifications Panel">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Animated notification list with mark-as-read, delete, and clear-all — from <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">components/dashboard/notifications</code>.
        </p>
        <div className="max-w-md mx-auto">
          <NotificationsWidget initialNotifications={demoNotifications} />
        </div>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── DASHBOARD CHART ── */}
      <Section title="Dashboard Chart (Recharts)">
        <p className="text-xs text-foreground/50 -mt-3 mb-4">
          Interactive area chart with week/month/year tabs — from <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">components/dashboard/chart</code>.
        </p>
        <DashboardChart />
      </Section>


<hr className="glass-divider my-8" />

      {/* ── COLOR PALETTE ── */}
      <Section title="Glass Color Palette">
        <GlassCard>
          <Grid cols={4}>
            <ColorSwatch label="bg-indigo-500/20" colorClass="bg-indigo-500/20" />
            <ColorSwatch label="bg-emerald-500/20" colorClass="bg-emerald-500/20" />
            <ColorSwatch label="bg-rose-500/20" colorClass="bg-rose-500/20" />
            <ColorSwatch label="bg-amber-500/20" colorClass="bg-amber-500/20" />
            <ColorSwatch label="bg-cyan-500/20" colorClass="bg-cyan-500/20" />
            <ColorSwatch label="bg-violet-500/20" colorClass="bg-violet-500/20" />
            <ColorSwatch label="bg-white/10" colorClass="bg-white/10" />
            <ColorSwatch label="bg-white/20" colorClass="bg-white/20" />
          </Grid>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── USAGE ── */}
      <Section title="CSS Classes Reference">
        <GlassCard>
          <div className="space-y-3 text-sm text-foreground/70 leading-relaxed">
            <p>Apply these glass classes to any element:</p>
            <div className="bg-black/30 rounded-lg p-4 font-mono text-[11px] space-y-1.5 text-foreground/60">
              <div><span className="text-indigo-400">.glass</span> {"{background: rgba(255,255,255,0.08); backdrop-filter: blur(12px);}"}</div>
              <div><span className="text-indigo-400">.glass-strong</span> {"{background: rgba(255,255,255,0.14); backdrop-filter: blur(16px);}"}</div>
              <div><span className="text-indigo-400">.glass-card</span> {"{background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);}"}</div>
              <div><span className="text-indigo-400">.glass-btn</span> {"{background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);}"}</div>
              <div><span className="text-indigo-400">.glass-btn-primary</span> {"{gradient indigo→violet; backdrop-filter: blur(8px);}"}</div>
              <div><span className="text-indigo-400">.glass-btn-success</span> {"{gradient emerald→teal; backdrop-filter: blur(8px);}"}</div>
              <div><span className="text-indigo-400">.glass-btn-destructive</span> {"{gradient rose→red; backdrop-filter: blur(8px);}"}</div>
              <div><span className="text-indigo-400">.glass-badge</span> {"{background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);}"}</div>
              <div><span className="text-indigo-400">.glass-input</span> {"{background: rgba(255,255,255,0.06); backdrop-filter: blur(8px);}"}</div>
              <div><span className="text-indigo-400">.glass-divider</span> {"{gradient gradient transparent→white/10→transparent}"}</div>
            </div>
            <p className="text-xs">Combine with <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">glow="indigo" | "emerald" | "rose" | "amber"</code> for accent borders and shadows.</p>
          </div>
        </GlassCard>
      </Section>

      <hr className="glass-divider my-8" />

      {/* ── EXTERNAL PAGE LINKS ── */}
      <Section title="External Resources">
        <Grid cols={2}>
          <a
            href="https://app.notion.com/p/Claude-Dashboard-a8e881eceb328360b52c8170fd7e7682"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <GlassCard glow="indigo">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-indigo-500/20 transition-colors">
                  <svg className="size-5 text-foreground/70 group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.5 3.5C3.4 3.5 2.5 4.4 2.5 5.5v13c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2v-13c0-1.1-.9-2-2-2h-15zm0 1.5h15c.3 0 .5.2.5.5v13c0 .3-.2.5-.5.5h-15c-.3 0-.5-.2-.5-.5v-13c0-.3.2-.5.5-.5zm1.5 2v1.5h12V7H6zm0 3v1.5h12V10H6zm0 3v1.5h12V13H6zm0 3v1.5h8V16H6z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-indigo-400 transition-colors">Claude Dashboard</div>
                  <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Notion Page</div>
                </div>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed">
                ZES Claude Dashboard — project overview, agent integration guide, and system architecture documentation hosted on Notion.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-indigo-400/70 group-hover:text-indigo-400 transition-colors">
                <span>Open page</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </GlassCard>
          </a>

          <a
            href="https://app.notion.com/p/Claude-Dashboard-a8e881eceb328360b52c8170fd7e7682"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <GlassCard glow="cyan">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-cyan-500/20 transition-colors">
                  <Book className="size-5 text-foreground/70 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-cyan-400 transition-colors">System Docs</div>
                  <div className="text-[10px] text-foreground/50 uppercase tracking-wider">Notion Wiki</div>
                </div>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed">
                ZES orchestration system documentation — agent workflow guides, architecture decisions, deployment runbooks, and reference materials.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-cyan-400/70 group-hover:text-cyan-400 transition-colors">
                <span>Open page</span>
                <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </GlassCard>
          </a>
        </Grid>
      </Section>
    </DashboardPageLayout>
  );
}
