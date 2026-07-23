"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, DollarSign, Target, Activity } from "lucide-react";
import BuildingIcon from "@/components/icons/building";
import Link from "next/link";

interface CompanySummary {
  id: string; name: string; description?: string;
  status: string; monthlyBudgetCents: number; spentMonthCents: number;
  agentCount: number; isPrimary?: boolean;
}

function formatCents(cents: number): string {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function CompanyComparePage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/company", { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          const list: CompanySummary[] = [];
          if (data.primary) list.push(data.primary);
          if (data.companies) list.push(...data.companies);
          setCompanies(list);
        }
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const maxBudget = Math.max(...companies.map(c => c.monthlyBudgetCents), 1);
  const maxSpent = Math.max(...companies.map(c => c.spentMonthCents), 1);
  const maxAgents = Math.max(...companies.map(c => c.agentCount), 1);

  return (
    <DashboardPageLayout
      header={{
        title: "Company Comparison",
        description: `${companies.length} companies · side-by-side metrics`,
        icon: BuildingIcon,
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading companies...</div>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <BuildingIcon className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No companies found</p>
        </div>
      ) : (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {companies.map((c) => {
              const util = c.monthlyBudgetCents > 0 ? (c.spentMonthCents / c.monthlyBudgetCents) * 100 : 0;
              return (
                <Link key={c.id} href={`/company/${c.id}`} className="block">
                  <div className={cn(
                    "rounded-lg border p-4 transition-all hover:border-primary/40 hover:bg-accent/20 cursor-pointer",
                    c.isPrimary ? "border-primary/30 bg-primary/5" : "border-border/40 bg-accent/10"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center text-xs font-bold",
                        c.isPrimary ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                      )}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{c.name}</div>
                        {c.isPrimary && <Badge variant="outline" className="text-[7px] mt-0.5">PRIMARY</Badge>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-mono font-medium">{formatCents(c.monthlyBudgetCents)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-mono">{formatCents(c.spentMonthCents)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            util >= 100 ? "bg-destructive" : util >= 80 ? "bg-warning" : "bg-success"
                          )}
                          style={{ width: Math.min(util, 100) + "%" }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className={cn("font-mono", util >= 80 ? "text-warning" : "text-success")}>{util.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-muted-foreground">Agents</span>
                        <span className="font-mono">{c.agentCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Comparison Table */}
          <DashboardCard title="DETAILED COMPARISON">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Company</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Budget</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Spent</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Utilization</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Agents</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Budget/Agent</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Budget Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => {
                    const util = c.monthlyBudgetCents > 0 ? (c.spentMonthCents / c.monthlyBudgetCents) * 100 : 0;
                    const perAgent = c.agentCount > 0 ? c.monthlyBudgetCents / c.agentCount : 0;
                    return (
                      <tr key={c.id} className={cn(
                        "border-b border-border/20 hover:bg-accent/10 transition-colors",
                        c.isPrimary && "bg-primary/5"
                      )}>
                        <td className="py-2.5 px-2">
                          <Link href={`/company/${c.id}`} className="flex items-center gap-2 hover:text-primary">
                            <span className={cn("size-1.5 rounded-full", c.status === "active" ? "bg-success" : "bg-warning")} />
                            <span className="font-medium">{c.name}</span>
                            {c.isPrimary && <Badge variant="outline" className="text-[7px]">P</Badge>}
                          </Link>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCents(c.monthlyBudgetCents)}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCents(c.spentMonthCents)}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={cn("font-mono", util >= 80 ? "text-warning" : "text-success")}>{util.toFixed(1)}%</span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{c.agentCount}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCents(perAgent)}</td>
                        <td className="py-2.5 px-2">
                          <span className="text-[10px] uppercase">{c.status}</span>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden w-24 ml-auto">
                            <div
                              className={cn("h-full rounded-full", util >= 80 ? "bg-warning" : "bg-success")}
                              style={{ width: Math.min(util, 100) + "%" }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DashboardCard>

          {/* Market Share Pie (simplified) */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="BUDGET DISTRIBUTION">
              <div className="space-y-3">
                {companies.map((c, i) => {
                  const pct = (c.monthlyBudgetCents / maxBudget) * 100;
                  const colors = ["bg-indigo-500", "bg-cyan-500", "bg-amber-500", "bg-rose-500", "bg-emerald-500"];
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className={cn("size-3 rounded-sm shrink-0", colors[i % colors.length])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{c.name}</span>
                          <span className="font-mono text-muted-foreground">{formatCents(c.monthlyBudgetCents)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: pct + "%" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>

            <DashboardCard title="AGENT DISTRIBUTION">
              <div className="space-y-3">
                {companies.map((c, i) => {
                  const pct = (c.agentCount / maxAgents) * 100;
                  const colors = ["bg-indigo-500", "bg-cyan-500", "bg-amber-500", "bg-rose-500", "bg-emerald-500"];
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className={cn("size-3 rounded-sm shrink-0", colors[i % colors.length])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{c.name}</span>
                          <span className="font-mono text-muted-foreground">{c.agentCount} agents</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: pct + "%" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}
