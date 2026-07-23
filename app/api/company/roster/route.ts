import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const ROSTER_PATH = join(homedir(), ".hermes", "roster.json");

function ensureDir() {
  const dir = join(homedir(), ".hermes");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function ensureRoster() {
  ensureDir();
  if (!existsSync(ROSTER_PATH)) {
    const defaults = {
      company: {
        id: "zes-1", name: "ZES System",
        description: "Autonomous AI Agent Orchestration System",
        status: "active", monthlyBudgetCents: 1000000,
        spentMonthCents: 0, currency: "USD",
      },
      agents: [], budget_policies: [],
    };
    writeFileSync(ROSTER_PATH, JSON.stringify(defaults, null, 2));
  }
}

export async function GET() {
  try {
    ensureRoster();
    const data = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));

    // Build org tree
    const agentMap = new Map(
      data.agents.map((a: any) => [a.id, { ...a, reports: [] }]),
    );
    const roots: any[] = [];
    for (const agent of data.agents) {
      if (!agent.reportsTo) {
        const root = agentMap.get(agent.id);
        if (root) roots.push(root);
      } else {
        const parent = agentMap.get(agent.reportsTo);
        if (parent) parent.reports.push(agentMap.get(agent.id));
      }
    }

    const totalBudget = data.agents.reduce(
      (s: number, a: any) => s + (a.budgetMonthlyCents || 0), 0,
    );
    const totalSpent = data.agents.reduce(
      (s: number, a: any) => s + (a.spentMonthCents || 0), 0,
    );

    return NextResponse.json({
      company: data.company,
      agents: data.agents,
      orgTree: roots,
      budget_policies: data.budget_policies,
      stats: {
        totalAgents: data.agents.length,
        running: data.agents.filter((a: any) => a.status === "running").length,
        active: data.agents.filter((a: any) => a.status === "active").length,
        paused: data.agents.filter(
          (a: any) => a.status === "paused" || a.status === "error",
        ).length,
        totalBudgetCents: totalBudget,
        totalSpentCents: totalSpent,
        utilizationPercent:
          totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        monthlyBudgetCents: data.company.monthlyBudgetCents || totalBudget,
        monthlySpentCents: data.company.spentMonthCents || totalSpent,
        monthlyUtilPercent:
          (data.company.monthlyBudgetCents || totalBudget) > 0
            ? Math.round(
                ((data.company.spentMonthCents || totalSpent) /
                  (data.company.monthlyBudgetCents || totalBudget)) *
                  100,
              )
            : 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureRoster();
    const data = await request.json();
    writeFileSync(ROSTER_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ status: "ok" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
