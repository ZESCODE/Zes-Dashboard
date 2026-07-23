"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users, DollarSign, Target, AlertTriangle, ArrowLeft, FileText, GitBranch,
} from "lucide-react";
import BuildingIcon from "@/components/icons/building";
import Link from "next/link";

interface Agent {
  id: string; name: string; role: string; title: string;
  status: string; reportsTo: string | null; budgetMonthlyCents: number;
  spentMonthCents: number; lastHeartbeat: string; capabilities: string[];
}

interface CompanyDetail {
  id: string; name: string; description?: string;
  status: string; monthlyBudgetCents: number; spentMonthCents: number;
  agents: Agent[]; isPrimary?: boolean;
}

function formatCents(cents: number): string {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusDot(status: string): string {
  switch (status) {
    case "running": return "bg-cyan-400";
    case "active": return "bg-success";
    case "paused": case "planned": return "bg-warning";
    case "error": case "blocked": return "bg-destructive";
    default: return "bg-muted-foreground";
  }
}

function roleBadge(role: string): string {
  switch (role) {
    case "ceo": return "bg-purple-500/20 text-purple-400";
    case "engineer": return "bg-blue-500/20 text-blue-400";
    case "communicator": return "bg-cyan-500/20 text-cyan-400";
    case "infrastructure": return "bg-amber-500/20 text-amber-400";
    default: return "bg-muted text-muted-foreground";
  }
}

function exportMarkdown(company: CompanyDetail | null) {
  if (!company) return;
  const lines: string[] = [];
  lines.push(`# ${company.name}`);
  if (company.description) lines.push(`\n${company.description}`);
  lines.push(`\n- **Status:** ${company.status || "active"}`);
  lines.push(`- **Budget:** ${formatCents(company.monthlyBudgetCents || 0)}/mo`);
  lines.push(`- **Spent:** ${formatCents(company.spentMonthCents || 0)}`);
  const util = company.monthlyBudgetCents ? ((company.spentMonthCents || 0) / company.monthlyBudgetCents * 100).toFixed(1) + "%" : "N/A";
  lines.push(`- **Utilization:** ${util}`);
  lines.push(`- **Agents:** ${(company.agents || []).length}`);
  lines.push("\n## Roster\n");
  lines.push("| Name | Role | Title | Status | Budget | Spent |");
  lines.push("|------|------|-------|--------|--------|-------|");
  for (const a of company.agents || []) {
    lines.push(`| ${a.name} | ${a.role} | ${a.title} | ${a.status} | ${formatCents(a.budgetMonthlyCents)} | ${formatCents(a.spentMonthCents)} |`);
  }
  if (company.goals && company.goals.length > 0) {
    lines.push("\n## Goals\n");
    for (const g of company.goals) {
      lines.push(`- [${g.status === "completed" ? "x" : " "}] **${g.name}** — ${g.progress || 0}%`);
    }
  }
  lines.push(`\n---\n*Exported from ZES Dashboard on ${new Date().toISOString().slice(0, 10)}*`);
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${company.name.toLowerCase().replace(/\s+/g, "-")}-roster.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/company/${companyId}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(res.status === 404 ? "Company not found" : "Failed to load");
      const data = await res.json();
      setCompany(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const budgetUtil = company ? (company.spentMonthCents / company.monthlyBudgetCents) * 100 : 0;

  return (
    <DashboardPageLayout
      header={{
        title: company?.name || "Company",
        description: company
          ? `${company.description || company.status} · ${formatCents(company.monthlyBudgetCents)}/mo`
          : "Loading company...",
        icon: BuildingIcon,
        actions: (
          <div className="flex items-center gap-2">
            <Link href="/company">
              <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                <ArrowLeft className="size-3 mr-1" /> BACK
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={fetchData}>
              REFRESH
            </Button>
          </div>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading company...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>RETRY</Button>
        </div>
      ) : company ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <DashboardStat
              label="AGENTS"
              value={String(company.agents?.length || 0)}
              description="TEAM MEMBERS"
              icon={Users}
              intent={(company.agents?.length || 0) > 0 ? "positive" : "negative"}
              direction="up"
            />
            <DashboardStat
              label="BUDGET UTILIZATION"
              value={budgetUtil.toFixed(1) + "%"}
              description={formatCents(company.spentMonthCents) + " of " + formatCents(company.monthlyBudgetCents)}
              icon={DollarSign}
              intent={budgetUtil >= 80 ? "negative" : budgetUtil >= 50 ? "warning" : "positive"}
              direction={budgetUtil >= 50 ? "up" : "down"}
            />
            <DashboardStat
              label="STATUS"
              value={company.status.toUpperCase()}
              description={company.isPrimary ? "PRIMARY COMPANY" : "PROJECT GROUP"}
              icon={Target}
              intent={company.status === "active" ? "positive" : "negative"}
              direction={company.status === "active" ? "up" : "down"}
            />
            <DashboardStat
              label="MONTHLY BUDGET"
              value={formatCents(company.monthlyBudgetCents)}
              description="USD"
              icon={DollarSign}
              intent="positive"
              direction="up"
            />
          </div>

          {/* Agent Roster */}
          <DashboardCard
            title="AGENT ROSTER"
            addon={
              <Badge variant="outline" className="text-[9px]">
                {company.agents?.length || 0} AGENTS
              </Badge>
            }
            className="mb-6"
          >
            {company.agents && company.agents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Agent</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Role</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Reports To</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Budget</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Spent</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.agents.map((agent) => {
                      const util = agent.budgetMonthlyCents > 0
                        ? (agent.spentMonthCents / agent.budgetMonthlyCents) * 100
                        : 0;
                      const reportsToName = agent.reportsTo
                        ? company.agents?.find((a) => a.id === agent.reportsTo)?.name || agent.reportsTo
                        : "—";
                      return (
                        <tr key={agent.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <span className={cn("size-2 rounded-full", statusDot(agent.status))} />
                              <span className="font-medium">{agent.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2">
                            <Badge variant="outline" className={cn("text-[9px]", roleBadge(agent.role))}>
                              {agent.title || agent.role}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground">{reportsToName}</td>
                          <td className="py-2.5 px-2">
                            <span className="font-mono text-[10px] uppercase">{agent.status}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">{formatCents(agent.budgetMonthlyCents)}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{formatCents(agent.spentMonthCents)}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={cn(
                              "font-mono",
                              util >= 80 ? "text-destructive" : util >= 50 ? "text-warning" : "text-success"
                            )}>
                              {util.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 gap-3">
                <Users className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No agents in this company yet</p>
                <p className="text-xs text-muted-foreground/70">Use the Laboratory page to hire agents</p>
              </div>
            )}
          </DashboardCard>

          {/* Capabilities & Policies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Capabilities */}
            <DashboardCard title="AGENT CAPABILITIES">
              {company.agents && company.agents.length > 0 ? (
                <div className="space-y-3">
                  {company.agents.map((agent) => (
                    <div key={agent.id} className="bg-accent/15 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn("size-1.5 rounded-full", statusDot(agent.status))} />
                        <span className="text-xs font-medium">{agent.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(agent.capabilities || []).map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-[9px]">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No capabilities data</p>
              )}
            </DashboardCard>

            {/* Quick Actions */}
            <DashboardCard title="QUICK ACTIONS">
              <div className="space-y-3">
                <Link href={`/org-chart?company=${companyId}`}>
                  <Button variant="outline" className="w-full justify-start text-xs h-9">
                    <Users className="size-3.5 mr-2" /> View Org Chart
                  </Button>
                </Link>
                <Link href={`/company/${companyId}/pipeline`}>
                  <Button variant="outline" className="w-full justify-start text-xs h-9 border-rose-500/30 text-rose-400 hover:text-rose-300">
                    <GitBranch className="size-3.5 mr-2" /> Pipeline (Human-in-the-Loop)
                  </Button>
                </Link>
                <Link href="/laboratory">
                  <Button variant="outline" className="w-full justify-start text-xs h-9">
                    <Target className="size-3.5 mr-2" /> Hire New Agent
                  </Button>
                </Link>
                <Link href="/company">
                  <Button variant="outline" className="w-full justify-start text-xs h-9">
                    <BuildingIcon className="size-3.5 mr-2" /> Back to Board Room
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-9"
                  onClick={() => exportMarkdown(company)}
                >
                  <FileText className="size-3.5 mr-2" /> Export as Markdown
                </Button>
              </div>
            </DashboardCard>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">Company not found</p>
        </div>
      )}
    </DashboardPageLayout>
  );
}
