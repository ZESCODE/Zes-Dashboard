import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

const MGR_PATH = join(homedir(), ".hermes", "companies_manager.py");
const COMPANIES_PATH = join(homedir(), ".hermes", "companies.json");
const ROSTER_PATH = join(homedir(), ".hermes", "roster.json");

const execAsync = promisify(execFile);

export async function GET() {
  try {
    // Get custom companies from companies.json
    let companies: any[] = [];
    if (existsSync(COMPANIES_PATH)) {
      const data = JSON.parse(readFileSync(COMPANIES_PATH, "utf-8"));
      companies = data.companies || [];
    }

    // Get primary company from roster.json
    let primary: any = null;
    if (existsSync(ROSTER_PATH)) {
      const roster = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));
      if (roster.company) {
        primary = {
          id: roster.company.id,
          name: roster.company.name,
          description: roster.company.description,
          status: roster.company.status,
          monthlyBudgetCents: roster.company.monthlyBudgetCents,
          spentMonthCents: roster.company.spentMonthCents,
          agentCount: (roster.agents || []).length,
          isPrimary: true,
        };
      }
    }

    return NextResponse.json({
      primary,
      companies: companies.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        status: c.status || "active",
        monthlyBudgetCents: c.monthlyBudgetCents || 500000,
        spentMonthCents: c.spentMonthCents || 0,
        agentCount: (c.agents || []).length,
        isPrimary: false,
      })),
      total: (primary ? 1 : 0) + companies.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, budget_cents, agent_types } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    // Build CLI args
    const args = [MGR_PATH, "create", name.trim()];
    if (description) {
      args.push("--description", description);
    }
    if (budget_cents) {
      args.push("--budget", String(Math.round(budget_cents)));
    }
    if (agent_types && Array.isArray(agent_types) && agent_types.length > 0) {
      args.push("--agents", agent_types.join(","));
    }

    const { stdout, stderr } = await execAsync("python3", args);

    if (stderr) {
      console.warn("companies_manager stderr:", stderr);
    }

    // Parse the created company ID from output
    const lines = stdout.trim().split("\n");
    const idLine = lines[0] || "";
    const match = idLine.match(/Created company:\s+(\S+)/);
    const companyId = match ? match[1] : null;

    // Fetch the full company data
    let company = null;
    if (companyId) {
      try {
        const { stdout: detailJson } = await execAsync("python3", [MGR_PATH, "get", companyId]);
        company = JSON.parse(detailJson);
      } catch {}
    }

    return NextResponse.json({
      status: "ok",
      message: idLine,
      companyId,
      company,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
