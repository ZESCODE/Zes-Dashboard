import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const ROSTER_PATH = join(homedir(), ".hermes", "roster.json");
const ROADMAP_PATH = join(homedir(), ".hermes", "roadmap.json");

export async function GET() {
  try {
    let rosterData: any = { company: {}, agents: [], budget_policies: [] };
    if (existsSync(ROSTER_PATH))
      rosterData = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));

    let roadmapData: any = { goals: [] };
    if (existsSync(ROADMAP_PATH))
      roadmapData = JSON.parse(readFileSync(ROADMAP_PATH, "utf-8"));

    const policies = rosterData.budget_policies || [];
    const agents = rosterData.agents || [];
    const company = rosterData.company || {};

    const policySummaries = policies.map((policy: any) => {
      let observedAmount = 0;
      let scopeName = "";
      if (policy.scopeType === "company") {
        observedAmount = company.spentMonthCents || 0;
        scopeName = company.name || "Company";
      } else if (policy.scopeType === "agent") {
        const agent = agents.find((a: any) => a.id === policy.scopeId);
        observedAmount = agent?.spentMonthCents || 0;
        scopeName = agent?.name || policy.scopeId;
      }
      const pct = policy.amount > 0 ? Math.round((observedAmount / policy.amount) * 100) : 0;
      let status: "ok" | "warning" | "hard_stop" = "ok";
      if (observedAmount >= policy.amount) status = "hard_stop";
      else if (pct >= policy.warnPercent) status = "warning";
      return {
        policyId: policy.id,
        scopeType: policy.scopeType,
        scopeId: policy.scopeId,
        scopeName,
        metric: policy.metric,
        windowKind: policy.windowKind,
        amount: policy.amount,
        observedAmount,
        remainingAmount: Math.max(0, policy.amount - observedAmount),
        utilizationPercent: pct,
        warnPercent: policy.warnPercent,
        hardStopEnabled: policy.hardStopEnabled,
        notifyEnabled: policy.notifyEnabled,
        isActive: policy.isActive,
        status,
      };
    });

    const activeIncidents = policySummaries
      .filter((p: any) => p.status === "hard_stop" || p.status === "warning")
      .map((p: any) => ({
        id: `inc-${p.policyId}`,
        policyId: p.policyId,
        scopeType: p.scopeType,
        scopeName: p.scopeName,
        thresholdType: p.status === "hard_stop" ? "hard_stop" : "warning",
        amountLimit: p.amount,
        amountObserved: p.observedAmount,
        status: "active" as const,
      }));

    const pausedAgentCount = agents.filter(
      (a: any) => a.status === "paused" || a.status === "error",
    ).length;

    return NextResponse.json({
      companyId: company.id || "zes-1",
      policies: policySummaries,
      activeIncidents,
      pausedAgentCount,
      pausedProjectCount: 0,
      pendingApprovalCount: activeIncidents.filter(
        (i: any) => i.thresholdType === "hard_stop",
      ).length,
      overview: {
        totalBudgetCents:
          company.monthlyBudgetCents ||
          policySummaries.reduce((s: number, p: any) => s + p.amount, 0),
        totalSpentCents:
          company.spentMonthCents ||
          policySummaries.reduce((s: number, p: any) => s + p.observedAmount, 0),
        overallUtilizationPercent:
          (company.monthlyBudgetCents || 1) > 0
            ? Math.round(
                ((company.spentMonthCents || 0) /
                  (company.monthlyBudgetCents || 1)) * 100,
              )
            : 0,
      },
      goals: (roadmapData.goals || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        progress: g.progress,
        status: g.status,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
