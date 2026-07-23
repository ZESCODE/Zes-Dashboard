"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DollarSign, AlertTriangle, Shield, Zap, Target,
  Plus, Check, X, ChevronRight, ArrowLeft,
} from "lucide-react";
import BracketsIcon from "@/components/icons/brackets";
import BuildingIcon from "@/components/icons/building";

/* --------------- Types --------------- */

interface BudgetPolicy {
  policyId: string; scopeType: string; scopeId: string; scopeName: string;
  metric: string; amount: number; observedAmount: number; remainingAmount: number;
  utilizationPercent: number; warnPercent: number; hardStopEnabled: boolean;
  status: "ok" | "warning" | "hard_stop";
}

interface BudgetData {
  policies: BudgetPolicy[];
  activeIncidents: any[];
  pausedAgentCount: number;
  pendingApprovalCount: number;
  overview: { totalBudgetCents: number; totalSpentCents: number; overallUtilizationPercent: number; };
  goals: { id: string; name: string; progress: number; status: string; }[];
}

interface RosterData {
  company: { id: string; name: string; monthlyBudgetCents: number; spentMonthCents: number; };
  agents: { id: string; name: string; role: string; budgetMonthlyCents: number; spentMonthCents: number; }[];
  budget_policies: any[];
}

/* --------------- Helpers --------------- */

function formatCents(c: number): string {
  if (c >= 100000) return "$" + (c / 100).toLocaleString();
  return "$" + (c / 100).toFixed(2);
}

/* --------------- Policy Card --------------- */

function PolicyCard({ policy }: { policy: BudgetPolicy }) {
  const pct = policy.utilizationPercent;
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all",
      policy.status === "hard_stop" ? "border-destructive/40 bg-destructive/5" :
      policy.status === "warning" ? "border-warning/40 bg-warning/5" :
      "border-border/40 bg-accent/10"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("size-2.5 rounded-full",
            policy.status === "hard_stop" ? "bg-destructive" :
            policy.status === "warning" ? "bg-warning" : "bg-success"
          )} />
          <span className="font-display text-sm font-bold">{policy.scopeName}</span>
        </div>
        <Badge variant={policy.status === "hard_stop" ? "destructive" : policy.status === "warning" ? "default" : "outline"} className="text-[9px]">
          {policy.status === "hard_stop" ? "HARD STOP" : policy.status === "warning" ? "WARNING" : "OK"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div>
          <div className="text-[10px] text-muted-foreground">Limit</div>
          <div className="font-mono font-bold">{formatCents(policy.amount)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Used</div>
          <div className="font-mono font-bold">{formatCents(policy.observedAmount)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Remaining</div>
          <div className="font-mono font-bold">{formatCents(policy.remainingAmount)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Scope</div>
          <div className="text-[10px] font-mono uppercase">{policy.scopeType}</div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Utilization</span>
          <span className={cn("font-mono font-bold",
            pct >= 100 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-success"
          )}>{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700",
            pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success"
          )} style={{ width: Math.min(pct, 100) + "%" }} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
        <Shield className="size-3" />
        <span>Warn at {policy.warnPercent}%</span>
        {policy.hardStopEnabled && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-destructive/80">Hard stop enabled</span>
          </>
        )}
      </div>
    </div>
  );
}

/* --------------- Budget Gauge --------------- */

function BudgetGauge({ percent, size = "lg" }: { percent: number; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? 140 : size === "md" ? 100 : 64;
  const stroke = size === "lg" ? 12 : size === "md" ? 8 : 6;
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
        <span className={"font-bold font-display " + (size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-xs")}>{percent}%</span>
      </div>
    </div>
  );
}

/* --------------- Page --------------- */

export default function BudgetPage() {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "policies" | "incidents">("overview");

  const fetchData = useCallback(async () => {
    try {
      const [budgetRes, rosterRes] = await Promise.all([
        fetch("/api/company/budget", { signal: AbortSignal.timeout(5000) }),
        fetch("/api/company/roster", { signal: AbortSignal.timeout(5000) }),
      ]);
      if (!budgetRes.ok) throw new Error("Budget API error");
      setBudget(await budgetRes.json());
      if (rosterRes.ok) setRoster(await rosterRes.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const b = budget;
  const pct = b?.overview?.overallUtilizationPercent ?? 0;
  const policies = b?.policies || [];
  const incidents = b?.activeIncidents || [];
  const agentBudgets = roster?.agents?.filter(a => a.budgetMonthlyCents > 0) || [];

  return (
    <DashboardPageLayout
      header={{
        title: "Budget Governor",
        description: "Spend tracking, policy management, and budget governance",
        icon: DollarSign,
        actions: (
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={fetchData}>
            REFRESH
          </Button>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading budget data...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>RETRY</Button>
        </div>
      ) : b ? (
        <>
          {/* Executive Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <DashboardStat label="TOTAL BUDGET" value={formatCents(b.overview?.totalBudgetCents ?? 0)} description={`${pct}% utilized`} icon={DollarSign}
              intent={pct >= 80 ? "negative" : "positive"} direction={pct > 50 ? "down" : "up"} />
            <DashboardStat label="SPENT" value={formatCents(b.overview?.totalSpentCents ?? 0)} description="Month to date" icon={Zap}
              intent="neutral" direction={pct > 50 ? "up" : "down"} />
            <DashboardStat label="POLICIES" value={String(policies.length)} description={`${policies.filter(p => p.status === "ok").length} healthy`} icon={Shield}
              intent={policies.filter(p => p.status !== "ok").length === 0 ? "positive" : "warning"} direction="up" />
            <DashboardStat label="INCIDENTS" value={String(incidents.length)} description={`${b.pausedAgentCount || 0} paused, ${b.pendingApprovalCount || 0} pending`} icon={AlertTriangle}
              intent={incidents.length > 0 ? "negative" : "positive"} direction={incidents.length > 0 ? "up" : "down"} />
          </div>

          {/* Main gauge */}
          <div className="flex items-center justify-center mb-6">
            <div className="glass rounded-xl p-6 flex flex-col items-center">
              <BudgetGauge percent={pct} size="lg" />
              <div className="mt-4 text-center">
                <div className="text-sm text-muted-foreground">Overall Budget Utilization</div>
                <div className="text-2xl font-display font-bold">{formatCents(b.overview?.totalSpentCents ?? 0)}</div>
                <div className="text-xs text-muted-foreground">of {formatCents(b.overview?.totalBudgetCents ?? 0)}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 mb-4 w-fit">
            {(["overview", "policies", "incidents"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={"px-4 py-1.5 text-[11px] rounded-md transition-colors font-medium " +
                  (tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Goals */}
              <DashboardCard title="GOALS BUDGET">
                {b.goals && b.goals.length > 0 ? (
                  <div className="space-y-3">
                    {b.goals.map((goal) => (
                      <div key={goal.id} className="bg-accent/15 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={"size-2 rounded-full " + (goal.status === "completed" || goal.status === "on_track" ? "bg-success" : goal.status === "attention" ? "bg-warning" : "bg-destructive")} />
                            <span className="text-xs font-medium">{goal.name}</span>
                          </div>
                          <span className={"text-[10px] font-mono " + (goal.progress >= 80 ? "text-success" : goal.progress >= 40 ? "text-warning" : "text-destructive")}>{goal.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={"h-full rounded-full " + (goal.progress >= 80 ? "bg-success" : goal.progress >= 40 ? "bg-warning" : "bg-destructive")}
                            style={{ width: Math.min(goal.progress, 100) + "%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 gap-2">
                    <Target className="size-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No goals with budgets</p>
                  </div>
                )}
              </DashboardCard>

              {/* Agent Budgets */}
              <DashboardCard title="AGENT ALLOCATIONS">
                {agentBudgets.length > 0 ? (
                  <div className="space-y-2">
                    {agentBudgets.map((agent) => {
                      const apct = agent.budgetMonthlyCents > 0
                        ? Math.round((agent.spentMonthCents / agent.budgetMonthlyCents) * 100) : 0;
                      return (
                        <div key={agent.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                          <div className={"size-2 rounded-full shrink-0 " + (apct >= 80 ? "bg-warning" : "bg-success")} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium">{agent.name}</div>
                            <div className="text-[9px] text-muted-foreground uppercase">{agent.role}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono">{formatCents(agent.spentMonthCents)}</div>
                            <div className="text-[9px] text-muted-foreground">of {formatCents(agent.budgetMonthlyCents)}</div>
                          </div>
                          <div className="w-16">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={"h-full rounded-full " + (apct >= 100 ? "bg-destructive" : apct >= 80 ? "bg-warning" : "bg-success")}
                                style={{ width: Math.min(apct, 100) + "%" }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 gap-2">
                    <DollarSign className="size-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No agent budgets configured</p>
                  </div>
                )}
              </DashboardCard>
            </div>
          )}

          {/* Policies Tab */}
          {tab === "policies" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {policies.length > 0 ? policies.map((policy) => (
                <PolicyCard key={policy.policyId} policy={policy} />
              )) : (
                <div className="col-span-full flex flex-col items-center py-16 gap-2">
                  <Shield className="size-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No budget policies defined</p>
                </div>
              )}
            </div>
          )}

          {/* Incidents Tab */}
          {tab === "incidents" && (
            <div className="space-y-3">
              {incidents.length > 0 ? incidents.map((inc: any) => (
                <div key={inc.id} className={"rounded-xl border p-4 " + (
                  inc.thresholdType === "hard_stop" ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/5"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={"size-5 " + (inc.thresholdType === "hard_stop" ? "text-destructive" : "text-warning")} />
                      <span className="font-display font-bold text-sm">{inc.scopeName}</span>
                    </div>
                    <Badge variant={inc.thresholdType === "hard_stop" ? "destructive" : "default"} className="text-[9px]">
                      {inc.thresholdType === "hard_stop" ? "HARD STOP" : "WARNING"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCents(inc.amountObserved)} of {formatCents(inc.amountLimit)} limit reached
                  </p>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={"h-full rounded-full " + (inc.thresholdType === "hard_stop" ? "bg-destructive" : "bg-warning")}
                      style={{ width: Math.min((inc.amountObserved / inc.amountLimit) * 100, 100) + "%" }} />
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center py-16 gap-2">
                  <Shield className="size-12 text-success/50" />
                  <p className="text-sm text-success font-medium">No Active Incidents</p>
                  <p className="text-xs text-muted-foreground">All budgets are within healthy ranges</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </DashboardPageLayout>
  );
}
