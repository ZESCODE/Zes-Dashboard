"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users, DollarSign, AlertTriangle,
  Target, Shield, Zap,
} from "lucide-react";
import BuildingIcon from "@/components/icons/building";

/* ────────────── Types ────────────── */

interface CompanyInfo {
  id: string; name: string; description: string; status: string;
  monthlyBudgetCents: number; spentMonthCents: number; currency: string;
}

interface Agent {
  id: string; name: string; role: string; title: string; description: string;
  reportsTo: string | null; status: string; adapterType: string;
  budgetMonthlyCents: number; spentMonthCents: number; lastHeartbeat: string;
  capabilities: string[]; reports?: Agent[];
}

interface BudgetPolicySummary {
  policyId: string; scopeType: string; scopeId: string; scopeName: string;
  metric: string; amount: number; observedAmount: number; remainingAmount: number;
  utilizationPercent: number; warnPercent: number; hardStopEnabled: boolean;
  status: "ok" | "warning" | "hard_stop";
}

interface BudgetData {
  policies: BudgetPolicySummary[];
  activeIncidents: any[];
  pausedAgentCount: number;
  pendingApprovalCount: number;
  overview: { totalBudgetCents: number; totalSpentCents: number; overallUtilizationPercent: number; };
  goals: { id: string; name: string; progress: number; status: string; }[];
}

interface RosterData {
  company: CompanyInfo; agents: Agent[]; orgTree: Agent[];
  stats: {
    totalAgents: number; running: number; active: number; paused: number;
    totalBudgetCents: number; totalSpentCents: number;
    utilizationPercent: number; monthlyUtilPercent: number;
  };
}

/* ────────────── Helpers ────────────── */

function formatCents(cents: number): string {
  if (cents >= 100000) return "$" + (cents / 100).toLocaleString();
  return "$" + (cents / 100).toFixed(2);
}

function statusColor(status: string): string {
  switch (status) {
    case "running": case "active": case "on_track": return "text-success";
    case "attention": case "warning": return "text-warning";
    case "blocked": case "hard_stop": case "error": return "text-destructive";
    case "paused": return "text-muted-foreground";
    case "completed": return "text-primary";
    default: return "text-muted-foreground";
  }
}

function roleBadgeColor(role: string): string {
  switch (role) {
    case "ceo": return "bg-purple-500/20 text-purple-400";
    case "engineer": return "bg-blue-500/20 text-blue-400";
    case "communicator": return "bg-cyan-500/20 text-cyan-400";
    case "infrastructure": return "bg-amber-500/20 text-amber-400";
    default: return "bg-muted text-muted-foreground";
  }
}

/* ────────────── Sub-Components ────────────── */

function BudgetGauge({ percent, size = "md" }: { percent: number; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? 120 : size === "md" ? 88 : 56;
  const stroke = size === "lg" ? 10 : size === "md" ? 8 : 6;
  const radius = (dims - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  const color = percent >= 100 ? "#ef4444" : percent >= 80 ? "#f59e0b" : "#22c55e";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dims} height={dims} className="-rotate-90">
        <circle cx={dims / 2} cy={dims / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle cx={dims / 2} cy={dims / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={"font-bold font-display " + (size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-xs")}>{percent}%</span>
      </div>
    </div>
  );
}

function UtilizationBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={"h-2 bg-muted rounded-full overflow-hidden " + (className || "")}>
      <div
        className={"h-full rounded-full transition-all duration-700 " + (
          percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-warning" : "bg-success"
        )}
        style={{ width: Math.min(percent, 100) + "%" }}
      />
    </div>
  );
}

function OrgTreeNode({ node, depth = 0 }: { node: Agent; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasReports = node.reports && node.reports.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent/50 cursor-pointer"
        style={{ paddingLeft: (depth * 20 + 12) + "px" }}
        onClick={() => hasReports && setExpanded(!expanded)}
      >
        {hasReports ? (
          <svg className={"size-3 transition-transform " + (expanded ? "rotate-90" : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        ) : (
          <span className="size-3" />
        )}
        <span className={"size-2.5 rounded-full shrink-0 " + (
          node.status === "running" ? "bg-cyan-400" :
          node.status === "active" ? "bg-green-400" :
          node.status === "paused" ? "bg-yellow-400" :
          node.status === "error" ? "bg-red-400" : "bg-muted-foreground"
        )} />
        <span className="font-medium flex-1">{node.name}</span>
        <span className={"text-[10px] px-1.5 py-0.5 rounded uppercase font-mono " + roleBadgeColor(node.role)}>
          {node.role}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {node.budgetMonthlyCents > 0
            ? Math.round((node.spentMonthCents / node.budgetMonthlyCents) * 100) + "%"
            : "—"}
        </span>
      </div>
      {hasReports && expanded && node.reports!.map((child) => (
        <OrgTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

/* ────────────── Tracker Types ────────────── */

interface TrackerEpic {
  id: string; name: string; tokens_used: number;
  percent_budget: number; status: string; progress: number;
  estimated_cost_cents?: number;
}

interface TrackerData {
  total_tokens: number;
  day_tokens: number;
  day_budget: number;
  day_percent: number;
  active_epic: string | null;
  epics: TrackerEpic[];
}

/* ────────────── Main Page ────────────── */

export default function CompanyPage() {
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [tracker, setTracker] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rosterRes, budgetRes, trackerRes] = await Promise.all([
        fetch("/api/company/roster", { signal: AbortSignal.timeout(4000) }),
        fetch("/api/company/budget", { signal: AbortSignal.timeout(4000) }),
        fetch("/api/company/tracker", { signal: AbortSignal.timeout(4000) }),
      ]);
      if (!rosterRes.ok || !budgetRes.ok) throw new Error("API error");
      const [r, b, t] = await Promise.all([
        rosterRes.json(), budgetRes.json(),
        trackerRes.ok ? trackerRes.json() : null,
      ]);
      setRoster(r);
      setBudget(b);
      setTracker(t);
    } catch (e: any) {
      setError(e.message || "Failed to load company data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const s = roster?.stats;
  const b = budget;

  return (
    <DashboardPageLayout
      header={{
        title: "Board Room",
        description: roster?.company?.name
          ? roster.company.name + " · $" + ((roster.company.monthlyBudgetCents || 0) / 100).toLocaleString() + "/mo budget"
          : "Company overview",
        icon: BuildingIcon,
        actions: (
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={fetchData}>
            REFRESH
          </Button>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading company data...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>RETRY</Button>
        </div>
      ) : (
        <>
          {/* Executive Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
            <DashboardStat
              label="AGENTS"
              value={"" + (s?.totalAgents ?? "—")}
              description={(s?.running ?? 0) + " running · " + (s?.active ?? 0) + " active"}
              icon={Users}
              intent={s && s.running > 0 ? "positive" : "negative"}
              direction={s && s.running === s?.totalAgents ? "up" : "neutral"}
            />
            <DashboardStat
              label="BUDGET UTILIZED"
              value={(b?.overview?.overallUtilizationPercent ?? 0) + "%"}
              description={b?.overview?.totalBudgetCents
                ? formatCents(b.overview.totalSpentCents) + " / " + formatCents(b.overview.totalBudgetCents)
                : "No budget set"}
              icon={DollarSign}
              intent={(b?.overview?.overallUtilizationPercent ?? 0) >= 80 ? "negative" : "positive"}
              direction={(b?.overview?.overallUtilizationPercent ?? 0) > 50 ? "down" : "up"}
            />
            <DashboardStat
              label="GOALS"
              value={"" + (b?.goals?.length ?? 0)}
              description={(b?.goals?.filter((g) => g.status === "on_track" || g.status === "completed").length ?? 0) + " on track"}
              icon={Target}
              intent={b && b.goals.length > 0 ? "positive" : "neutral"}
              direction="up"
            />
            <DashboardStat
              label="INCIDENTS"
              value={"" + (b?.activeIncidents?.length ?? 0)}
              description={(b?.pendingApprovalCount ?? 0) + " pending approval"}
              icon={AlertTriangle}
              intent={(b?.activeIncidents?.length ?? 0) > 0 ? "negative" : "positive"}
              direction={(b?.activeIncidents?.length ?? 0) > 0 ? "up" : "down"}
            />
          </div>

          {/* Budget + Org Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Budget Overview Card */}
            <DashboardCard title="BUDGET OVERVIEW" className="lg:col-span-2">
              <div className="flex flex-col items-center py-4">
                <BudgetGauge percent={b?.overview?.overallUtilizationPercent ?? 0} size="lg" />
                <div className="mt-4 text-center">
                  <div className="text-sm text-muted-foreground">Monthly Spend</div>
                  <div className="text-2xl font-display font-bold">
                    {formatCents(b?.overview?.totalSpentCents ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of {formatCents(b?.overview?.totalBudgetCents ?? 0)} budget
                  </div>
                </div>
              </div>

              {/* Policy breakdown */}
              <div className="mt-4 space-y-2">
                {b?.policies?.slice(0, 5).map((p) => (
                  <div key={p.policyId} className="bg-accent/15 rounded-lg p-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={"size-1.5 rounded-full " + (
                          p.status === "hard_stop" ? "bg-destructive" :
                          p.status === "warning" ? "bg-warning" : "bg-success"
                        )} />
                        <span className="font-medium">{p.scopeName}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">{p.utilizationPercent}%</span>
                    </div>
                    <UtilizationBar percent={p.utilizationPercent} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{formatCents(p.observedAmount)} used</span>
                      <span>{formatCents(p.amount)} limit</span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>

            {/* Org Chart Preview */}
            <DashboardCard
              title="ORGANIZATION"
              className="lg:col-span-3"
              addon={
                <Badge variant="outline" className="text-[9px]">{(s?.totalAgents ?? 0) + " AGENTS"}</Badge>
              }
            >
              {roster?.orgTree && roster.orgTree.length > 0 ? (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  {roster.orgTree.map((root) => (
                    <OrgTreeNode key={root.id} node={root} depth={0} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Users className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No agents in the organization</p>
                  <p className="text-xs text-muted-foreground/70">Create agents to build your org chart</p>
                </div>
              )}

              {/* Role legend */}
              <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-purple-400/50" /> CEO</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-400/50" /> Engineer</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-cyan-400/50" /> Communicator</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400/50" /> Infra</span>
              </div>
            </DashboardCard>
          </div>

          {/* Agent Spend Table */}
          <DashboardCard
            title="AGENT SPEND"
            addon={
              <Badge variant="outline" className="text-[9px]">
                {s?.totalBudgetCents ? formatCents(s.totalBudgetCents) : "—"} TOTAL BUDGET
              </Badge>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Agent</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Role</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Monthly Budget</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Spent</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {roster?.agents?.map((agent) => {
                    const pct = agent.budgetMonthlyCents > 0
                      ? Math.round((agent.spentMonthCents / agent.budgetMonthlyCents) * 100) : 0;
                    return (
                      <tr key={agent.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <span className={"size-2 rounded-full shrink-0 " + (
                              agent.status === "running" ? "bg-cyan-400" :
                              agent.status === "active" ? "bg-green-400" :
                              agent.status === "paused" ? "bg-yellow-400" :
                              agent.status === "error" ? "bg-red-400" : "bg-muted-foreground"
                            )} />
                            <span className="font-medium">{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={"text-[10px] px-1.5 py-0.5 rounded uppercase font-mono " + roleBadgeColor(agent.role)}>
                            {agent.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={"text-[10px] font-mono uppercase " + statusColor(agent.status)}>{agent.status}</span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCents(agent.budgetMonthlyCents)}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCents(agent.spentMonthCents)}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={"h-full rounded-full " + (pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success")}
                                style={{ width: Math.min(pct, 100) + "%" }}
                              />
                            </div>
                            <span className={"font-mono w-8 text-right " + (pct >= 100 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-success")}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DashboardCard>

          {/* Token Usage */}
          <DashboardCard
            title="TOKEN USAGE"
            addon={
              <Badge variant="outline" className="text-[9px]">
                {tracker ? (tracker.total_tokens ?? 0).toLocaleString() + " TOTAL" : "—"}
              </Badge>
            }
          >
            {tracker ? (
              <div className="space-y-3">
                {/* Daily budget bar */}
                <div className="bg-accent/15 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Zap className="size-3 text-primary" />
                      Daily Budget
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {tracker.day_tokens?.toLocaleString() ?? 0} / {tracker.day_budget?.toLocaleString() ?? "—"} tokens
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={"h-full rounded-full transition-all duration-700 " + (
                        (tracker.day_percent ?? 0) >= 100 ? "bg-destructive" :
                        (tracker.day_percent ?? 0) >= 80 ? "bg-warning" : "bg-success"
                      )}
                      style={{ width: Math.min(tracker.day_percent ?? 0, 100) + "%" }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{tracker.day_percent ?? 0}% consumed</span>
                    <span>{tracker.active_epic ? "Active: " + tracker.active_epic : "No active epic"}</span>
                  </div>
                </div>

                {/* Per-epic token usage */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Epic</th>
                        <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">Tokens</th>
                        <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">Budget %</th>
                        <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tracker.epics || [])
                        .filter((e: TrackerEpic) => e.tokens_used > 0)
                        .map((epic: TrackerEpic) => {
                          const costDollars = epic.tokens_used * 0.003 / 100;
                          return (
                            <tr key={epic.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <span className={"size-1.5 rounded-full " + (
                                    epic.status === "completed" ? "bg-success" :
                                    epic.status === "blocked" ? "bg-destructive" :
                                    epic.status === "attention" ? "bg-warning" : "bg-muted-foreground"
                                  )} />
                                  <span className="font-medium">{epic.name}</span>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right font-mono">{epic.tokens_used.toLocaleString()}</td>
                              <td className="py-2 px-2 text-right">
                                <span className={"font-mono " + (
                                  epic.percent_budget >= 100 ? "text-destructive" :
                                  epic.percent_budget >= 80 ? "text-warning" : "text-success"
                                )}>{epic.percent_budget}%</span>
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                                ${costDollars.toFixed(4)}
                              </td>
                            </tr>
                          );
                        })}
                      {(tracker.epics || []).filter((e: TrackerEpic) => e.tokens_used > 0).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">
                            No token usage recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 gap-2">
                <Zap className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Token tracker data unavailable</p>
                <p className="text-xs text-muted-foreground/70">Run: python3 ~/.hermes/token_tracker.py status</p>
              </div>
            )}
          </DashboardCard>

          {/* Goals & Incidents Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals Progress */}
            <DashboardCard title="GOALS PROGRESS">
              {b?.goals && b.goals.length > 0 ? (
                <div className="space-y-3">
                  {b.goals.map((goal) => (
                    <div key={goal.id} className="bg-accent/15 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={"size-2 rounded-full " + (
                            goal.status === "completed" ? "bg-success" :
                            goal.status === "on_track" ? "bg-success" :
                            goal.status === "attention" ? "bg-warning" : "bg-destructive"
                          )} />
                          <span className="text-sm font-medium">{goal.name}</span>
                        </div>
                        <span className={"text-[10px] font-mono " + (
                          goal.status === "completed" ? "text-success" :
                          goal.status === "on_track" ? "text-success" :
                          goal.status === "attention" ? "text-warning" : "text-destructive"
                        )}>{goal.progress}%</span>
                      </div>
                      <UtilizationBar percent={goal.progress} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Target className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No goals defined</p>
                </div>
              )}
            </DashboardCard>

            {/* Active Incidents */}
            <DashboardCard title="ACTIVE INCIDENTS">
              {b?.activeIncidents && b.activeIncidents.length > 0 ? (
                <div className="space-y-2">
                  {b.activeIncidents.map((inc: any) => (
                    <div key={inc.id} className={"rounded-lg p-3 border " + (
                      inc.thresholdType === "hard_stop"
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-warning/30 bg-warning/5"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={"size-4 " + (inc.thresholdType === "hard_stop" ? "text-destructive" : "text-warning")} />
                          <span className="text-sm font-medium">{inc.scopeName}</span>
                        </div>
                        <Badge variant={inc.thresholdType === "hard_stop" ? "destructive" : "default"} className="text-[9px]">
                          {inc.thresholdType === "hard_stop" ? "HARD STOP" : "WARNING"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCents(inc.amountObserved)} of {formatCents(inc.amountLimit)} — exceeds{" "}
                        {inc.thresholdType === "hard_stop" ? "hard limit" : "warning threshold"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Shield className="size-8 text-success/50" />
                  <p className="text-sm text-success">No active incidents</p>
                  <p className="text-xs text-muted-foreground">All budgets are within healthy ranges</p>
                </div>
              )}
            </DashboardCard>
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}
