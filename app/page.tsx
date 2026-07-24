"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardStat from "@/components/dashboard/stat";
import DashboardChart from "@/components/dashboard/chart";
import DashboardCard from "@/components/dashboard/card";
import RebelsRanking from "@/components/dashboard/rebels-ranking";
import SecurityStatus from "@/components/dashboard/security-status";
import ActivityFeed from "@/components/dashboard/activity-feed";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import BracketsIcon from "@/components/icons/brackets";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import BoomIcon from "@/components/icons/boom";
import { getHealth, getSystemInfo } from "@/lib/api-client";
import {
  Circle, Play, CheckCircle2, XCircle, Target, Users, ArrowRight,
  Server, Cpu, Wifi, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { FrostVariant } from "@/components/ui/card";

const iconMap = { gear: GearIcon, proccesor: ProcessorIcon, boom: BoomIcon };

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const taskStatusIcon: Record<string, React.ElementType> = {
  pending: Circle,
  running: Play,
  done: CheckCircle2,
  completed: CheckCircle2,
  failed: XCircle,
};
const taskStatusColor: Record<string, string> = {
  pending: "text-orange-400",
  running: "text-emerald-400",
  done: "text-success",
  completed: "text-success",
  failed: "text-destructive",
};

/* Derive frost from budget percentage */
function budgetFrost(pct: number): FrostVariant {
  if (pct >= 100) return "red";
  if (pct >= 80) return "red";
  if (pct >= 60) return "orange";
  return "green";
}

export default function DashboardOverview() {
  const router = useRouter();
  const isVercel = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_IS_VERCEL === 'true';

  useEffect(() => {
    if (isVercel) router.replace('/showcase');
  }, [isVercel, router]);

  if (isVercel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading showcase...</p>
        </div>
      </div>
    );
  }

  const [stats, setStats] = useState<any[]>([]);
  const [rebels, setRebels] = useState<any[]>([]);
  const [security, setSecurity] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [taskSummary, setTaskSummary] = useState({ total: 0, pending: 0, running: 0, done: 0, failed: 0 });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const [budgetData, setBudgetData] = useState<any>(null);

  const fetchData = async () => {
    const [health, system] = await Promise.all([getHealth(), getSystemInfo()]).catch(() => [null, null]);

    if (health) {
      const s = health.map((svc: any, i: number) => ({
        id: svc.service || svc.name || `svc-${i}`,
        name: svc.service || svc.name || `Service ${i}`,
        description: svc.description || svc.state || "",
        status: svc.running ? "running" : "stopped",
        port: svc.port || null,
      }));
      setStats(s);
    }
    if (system) {
      setLastUpdated(`${system.hostname || "ZES"} · Load: ${system.load?.[0]?.toFixed(1) || "?"}`);
    }

    try {
      const tRes = await fetch("/api/tasks", { signal: AbortSignal.timeout(3000) });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTaskSummary(tData.stats || { total: 0, pending: 0, running: 0, done: 0, failed: 0 });
        setRecentTasks((tData.tasks || []).slice(-5).reverse());
      }
    } catch {}

    try {
      const [cRes, trRes] = await Promise.all([
        fetch("/api/company", { signal: AbortSignal.timeout(3000) }),
        fetch("/api/company/tracker", { signal: AbortSignal.timeout(3000) }),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCompanyCount(cData.total || 0);
        let agents = 0;
        if (cData.primary) agents += cData.primary.agentCount || 0;
        if (cData.companies) agents += cData.companies.reduce((sum: number, c: any) => sum + (c.agentCount || 0), 0);
        setAgentCount(agents);
      }
      if (trRes.ok) setBudgetData(await trRes.json());
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, []);

  /* ── Derived frost values ── */
  const runningCount = stats.filter(s => s.status === "running").length;
  const servicesFrost: FrostVariant = runningCount > 0 ? "green" : "red";
  const pendingFrost: FrostVariant = taskSummary.pending > 10 ? "red" : taskSummary.pending > 0 ? "orange" : "green";
  const runningFrost: FrostVariant = taskSummary.running > 0 ? "green" : "blue";
  const failedFrost: FrostVariant = taskSummary.failed > 0 ? "red" : "green";
  const bFrost: FrostVariant = budgetData ? budgetFrost(budgetData.day_percent || 0) : "blue";

  /* Task queue card frost: red if failures, orange if pending, green if all running */
  const taskQueueFrost: FrostVariant =
    taskSummary.failed > 0 ? "red" :
    taskSummary.pending > 0 ? "orange" :
    taskSummary.running > 0 ? "green" : "blue";

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: lastUpdated || "ZES Orchestration System",
        icon: BracketsIcon,
      }}
    >
      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <DashboardStat
          label="SERVICES"
          value={String(runningCount)}
          description={`OF ${stats.length} ONLINE`}
          icon={Server}
          frost={servicesFrost}
          intent={runningCount > 0 ? "positive" : "negative"}
          direction="up"
        />
        <DashboardStat
          label="PENDING"
          value={String(taskSummary.pending)}
          description="IN QUEUE"
          icon={Circle}
          frost={pendingFrost}
          intent={taskSummary.pending > 0 ? "warning" : "positive"}
          direction={taskSummary.pending > 0 ? "up" : "down"}
        />
        <DashboardStat
          label="RUNNING"
          value={String(taskSummary.running)}
          description="ACTIVE TASKS"
          icon={Play}
          frost={runningFrost}
          intent={taskSummary.running > 0 ? "positive" : "negative"}
          direction={taskSummary.running > 0 ? "up" : "down"}
        />
        <DashboardStat
          label="COMPANIES"
          value={String(companyCount)}
          description="ACTIVE GROUPS"
          icon={Users}
          frost="blue"
          intent={companyCount > 0 ? "positive" : "negative"}
          direction={companyCount > 1 ? "up" : "down"}
        />
        <DashboardStat
          label="AGENTS"
          value={String(agentCount)}
          description="TOTAL"
          icon={Users}
          frost="blue"
          intent={agentCount > 0 ? "positive" : "negative"}
          direction={agentCount > 0 ? "up" : "down"}
        />
      </div>

      {/* ── Services Grid ── */}
      {stats.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 pl-0.5">
            Services
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map((svc) => {
              const frost: FrostVariant = svc.status === "running" ? "green" : "red";
              return (
                <div
                  key={svc.id}
                  className={cn(
                    "rounded-xl p-3 flex items-start gap-2.5 transition-all duration-300",
                    frost === "green" ? "glass-frost-green" : "glass-frost-red"
                  )}
                >
                  <div className={cn(
                    "size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                    frost === "green" ? "bg-emerald-500/15" : "bg-red-500/15"
                  )}>
                    <GearIcon className={cn("size-3", frost === "green" ? "text-emerald-400" : "text-red-400")} />
                  </div>
                  <div className="min-w-0">
                    <div className={cn(
                      "text-xs font-semibold truncate font-display",
                      frost === "green" ? "text-emerald-300" : "text-red-300"
                    )}>
                      {svc.name}
                    </div>
                    <div className="text-[10px] text-foreground/40 truncate">
                      {svc.port ? `port ${svc.port}` : svc.description || svc.status}
                    </div>
                  </div>
                  <div className={cn(
                    "size-1.5 rounded-full shrink-0 mt-1.5 ml-auto",
                    frost === "green" ? "bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                  )} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Three info cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Task Queue */}
        <DashboardCard
          title="TASK QUEUE"
          frost={taskQueueFrost}
          addon={
            <Link href="/orchestrator">
              <Badge variant="outline" className="text-[9px] cursor-pointer hover:bg-accent">
                VIEW ALL &rarr;
              </Badge>
            </Link>
          }
        >
          <div className="space-y-2 mb-3">
            {[
              { label: "Running", count: taskSummary.running, icon: Play, color: "text-emerald-400" },
              { label: "Pending", count: taskSummary.pending, icon: Circle, color: "text-orange-400" },
              { label: "Done", count: taskSummary.done, icon: CheckCircle2, color: "text-success" },
              { label: "Failed", count: taskSummary.failed, icon: XCircle, color: "text-destructive" },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Icon className={cn("size-3", color)} />
                  {label}
                </span>
                <span className={cn("font-mono font-bold tabular-nums", color)}>{count}</span>
              </div>
            ))}
          </div>
          {recentTasks.length > 0 && (
            <>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Recent</div>
              <div className="space-y-1">
                {recentTasks.map((t: any) => {
                  const Icon = taskStatusIcon[t.status] || Circle;
                  return (
                    <div key={t.id} className="flex items-center gap-2 text-[11px]">
                      <Icon className={cn("size-3 shrink-0", taskStatusColor[t.status] || "")} />
                      <span className="truncate text-muted-foreground">{t.title}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DashboardCard>

        {/* Budget */}
        <DashboardCard
          title="BUDGET"
          frost={bFrost}
          addon={
            <Link href="/company">
              <Badge variant="outline" className="text-[9px] cursor-pointer hover:bg-accent">
                DETAILS &rarr;
              </Badge>
            </Link>
          }
        >
          {budgetData ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Daily Usage</span>
                  <span className={cn(
                    "font-mono font-bold tabular-nums",
                    bFrost === "red" ? "text-red-300" : bFrost === "orange" ? "text-orange-300" : "text-emerald-300"
                  )}>
                    {budgetData.day_percent}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      bFrost === "red" ? "bg-red-500" : bFrost === "orange" ? "bg-orange-500" : "bg-emerald-500"
                    )}
                    style={{ width: Math.min(budgetData.day_percent || 0, 100) + "%" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span className="font-mono">{budgetData.day_tokens?.toLocaleString()} used</span>
                  <span className="font-mono">{budgetData.day_budget?.toLocaleString()} limit</span>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">All time: </span>
                <span className="font-mono font-bold">{(budgetData.total_tokens || 0).toLocaleString()} tokens</span>
              </div>
              {budgetData.active_epic && (
                <div className="text-[10px] text-primary flex items-center gap-1">
                  <Target className="size-3" /> Active: {budgetData.active_epic}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <AlertTriangle className="size-5 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Budget data unavailable</p>
            </div>
          )}
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard title="QUICK ACTIONS" frost="blue">
          <div className="space-y-2">
            {[
              { href: "/laboratory", label: "Hire Agent", desc: "Add new agents to your teams", frost: "green" as const },
              { href: "/orchestrator", label: "Dispatch Tasks", desc: "Create and assign tasks to agents", frost: "blue" as const },
              { href: "/company", label: "Company Dashboard", desc: "View budget, org chart, and roster", frost: "blue" as const },
            ].map(({ href, label, desc, frost: af }) => (
              <Link key={href} href={href}>
                <div className={cn(
                  "rounded-lg p-3 flex items-center justify-between group cursor-pointer transition-all duration-200",
                  af === "green"
                    ? "bg-emerald-500/8 border border-emerald-500/15 hover:bg-emerald-500/15 hover:border-emerald-500/30"
                    : "bg-blue-500/8 border border-blue-500/15 hover:bg-blue-500/15 hover:border-blue-500/30"
                )}>
                  <div>
                    <div className={cn(
                      "text-xs font-semibold",
                      af === "green" ? "text-emerald-300" : "text-blue-300"
                    )}>{label}</div>
                    <div className="text-[10px] text-muted-foreground">{desc}</div>
                  </div>
                  <ArrowRight className={cn(
                    "size-3 shrink-0 transition-transform group-hover:translate-x-0.5",
                    af === "green" ? "text-emerald-400/60" : "text-blue-400/60"
                  )} />
                </div>
              </Link>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* ── Chart ── */}
      <div className="mb-6">
        <DashboardChart />
      </div>

      {/* ── Rebels + Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RebelsRanking rebels={rebels} />
        <SecurityStatus statuses={security} />
      </div>

      {/* ── Activity ── */}
      <ActivityFeed />
    </DashboardPageLayout>
  );
}
