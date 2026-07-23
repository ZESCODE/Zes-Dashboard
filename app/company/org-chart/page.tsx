"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users, DollarSign, Target, ChevronRight, ChevronDown,
  Zap, Shield, AlertTriangle, Star,
} from "lucide-react";
import BracketsIcon from "@/components/icons/brackets";
import BuildingIcon from "@/components/icons/building";

/* --------------- Types --------------- */

interface Agent {
  id: string; name: string; role: string; title: string; description: string;
  reportsTo: string | null; status: string; adapterType: string;
  budgetMonthlyCents: number; spentMonthCents: number; lastHeartbeat: string;
  capabilities: string[];
  reports?: Agent[];
  icon?: string;
}

interface RosterData {
  company: { id: string; name: string; description: string; status: string; monthlyBudgetCents: number; spentMonthCents: number; };
  agents: Agent[]; orgTree: Agent[];
  stats: { totalAgents: number; running: number; active: number; paused: number; totalBudgetCents: number; totalSpentCents: number; utilizationPercent: number; };
}

/* --------------- Helpers --------------- */

function formatCents(c: number): string {
  if (c >= 100000) return "$" + (c / 100).toLocaleString();
  return "$" + (c / 100).toFixed(2);
}

function roleColor(role: string): string {
  switch (role) {
    case "ceo": return "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400";
    case "engineer": return "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400";
    case "communicator": return "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400";
    case "infrastructure": return "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400";
    default: return "from-muted/20 to-muted/10 border-muted/30 text-muted-foreground";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "running": case "active": return "bg-cyan-400";
    case "paused": return "bg-yellow-400";
    case "error": return "bg-red-400";
    default: return "bg-muted-foreground";
  }
}

/* --------------- Agent Card --------------- */

function AgentCard({ agent, depth = 0 }: { agent: Agent; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasReports = agent.reports && agent.reports.length > 0;
  const pct = agent.budgetMonthlyCents > 0
    ? Math.round((agent.spentMonthCents / agent.budgetMonthlyCents) * 100) : 0;

  return (
    <div className="relative">
      <div className={cn(
        "relative rounded-xl border p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/30",
        "bg-gradient-to-br " + roleColor(agent.role)
      )}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className={cn("size-3 rounded-full ring-2 ring-background", statusColor(agent.status))} />
            {hasReports && (
              <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
                {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-sm">{agent.name}</span>
              <Badge variant="outline" className={"text-[9px] uppercase font-mono " + roleColor(agent.role).split(" ").slice(-1)[0]}>{agent.role}</Badge>
              <span className={"text-[10px] font-mono " + (
                agent.status === "running" ? "text-cyan-400" :
                agent.status === "active" ? "text-green-400" :
                agent.status === "paused" ? "text-yellow-400" : "text-red-400"
              )}>{agent.status}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{agent.title}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">{agent.description}</div>
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.capabilities.map((cap) => (
                  <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded-full bg-background/50 border border-border/30 text-muted-foreground">{cap}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative size-12">
              <svg className="size-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none"
                  stroke={pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e"}
                  strokeWidth="3" strokeDasharray="97.4"
                  strokeDashoffset={97.4 - (97.4 * Math.min(pct, 100) / 100)}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={"text-[9px] font-bold font-mono " + (pct >= 100 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-success")}>{pct}%</span>
              </div>
            </div>
            <span className="text-[8px] text-muted-foreground font-mono">{formatCents(agent.budgetMonthlyCents)}</span>
          </div>
        </div>
      </div>
      {hasReports && expanded && (
        <div className="ml-6 mt-3 pl-4 border-l border-border/30 space-y-3">
          {agent.reports!.map((child) => (
            <AgentCard key={child.id} agent={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------- Summary Stat --------------- */

function SummaryStat({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3">
      <div className={"size-10 rounded-lg flex items-center justify-center " + color}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-lg font-display font-bold">{value}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

/* --------------- Page --------------- */

export default function OrgChartPage() {
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"tree" | "cards">("tree");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/company/roster", { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRoster(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = roster?.stats;

  return (
    <DashboardPageLayout
      header={{
        title: "Org Chart",
        description: roster?.company?.name || "Organization structure",
        icon: BuildingIcon,
        actions: (
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              <button onClick={() => setView("tree")} className={"px-3 py-1 text-[10px] rounded-md transition-colors " + (view === "tree" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Tree</button>
              <button onClick={() => setView("cards")} className={"px-3 py-1 text-[10px] rounded-md transition-colors " + (view === "cards" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Cards</button>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={fetchData}>REFRESH</Button>
          </div>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading org chart...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>RETRY</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <SummaryStat label="Total Agents" value={String(s?.totalAgents ?? 0)} sub={s?.running + " running" || "0 running"} icon={Users} color="bg-primary/20 text-primary" />
            <SummaryStat label="Budget" value={formatCents(s?.totalBudgetCents ?? 0)} sub={s?.utilizationPercent + "% utilized" || "0% utilized"} icon={DollarSign} color="bg-success/20 text-success" />
            <SummaryStat label="On Track" value={String(roster?.orgTree?.length ?? 0)} sub="Direct reports to CEO" icon={Target} color="bg-cyan-500/20 text-cyan-400" />
            <SummaryStat label="Health" value={s?.running === s?.totalAgents ? "All Good" : "Issues"} sub={s?.paused ? s.paused + " paused" : "All active"} icon={Shield} color="bg-emerald-500/20 text-emerald-400" />
          </div>

          <div className="flex items-center gap-4 mb-4 text-[10px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-purple-500" /> CEO</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Engineer</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-cyan-500" /> Communicator</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Infrastructure</span>
            <span className="flex items-center gap-1 ml-auto"><span className="size-2 rounded-full bg-cyan-400" /> Running</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-400" /> Active</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-yellow-400" /> Paused</span>
          </div>

          {view === "tree" ? (
            <DashboardCard title="ORGANIZATION TREE">
              {roster?.orgTree && roster.orgTree.length > 0 ? (
                <div className="space-y-4">
                  {roster.orgTree.map((root) => (
                    <AgentCard key={root.id} agent={root} depth={0} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Users className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No agents in the organization</p>
                </div>
              )}
            </DashboardCard>
          ) : (
            <DashboardCard title="AGENT CARDS">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roster?.agents?.map((agent) => {
                  const pct = agent.budgetMonthlyCents > 0 ? Math.round((agent.spentMonthCents / agent.budgetMonthlyCents) * 100) : 0;
                  return (
                    <div key={agent.id} className={"rounded-xl border p-4 transition-all hover:shadow-lg hover:border-primary/30 bg-gradient-to-br " + roleColor(agent.role)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={"size-2.5 rounded-full " + statusColor(agent.status)} />
                        <span className="font-display font-bold text-sm">{agent.name}</span>
                        <Badge variant="outline" className={"text-[9px] uppercase font-mono ml-auto " + roleColor(agent.role).split(" ").slice(-1)[0]}>{agent.role}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-2">{agent.title}</div>
                      {agent.capabilities && agent.capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.capabilities.map((cap) => (
                            <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded-full bg-background/50 border border-border/30 text-muted-foreground">{cap}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-mono">{formatCents(agent.budgetMonthlyCents)}</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={"h-full rounded-full transition-all " + (pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success")} style={{ width: Math.min(pct, 100) + "%" }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1">
                        <span className="text-muted-foreground">Spent</span>
                        <span className={"font-mono " + (pct >= 100 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-success")}>{formatCents(agent.spentMonthCents)} ({pct}%)</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-2 font-mono">Reports to: {agent.reportsTo || "CEO"}</div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          )}
        </>
      )}
    </DashboardPageLayout>
  );
}
