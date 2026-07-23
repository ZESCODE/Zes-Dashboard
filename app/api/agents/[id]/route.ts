import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

const ROSTER_PATH = join(homedir(), ".hermes", "roster.json");
const COMPANIES_PATH = join(homedir(), ".hermes", "companies.json");
const TASKS_PATH = join(homedir(), ".hermes", "tasks.json");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    let agent = null;
    let companySource = null;

    // Search primary roster
    if (existsSync(ROSTER_PATH)) {
      const roster = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));
      const found = (roster.agents || []).find((a: any) => a.id === agentId);
      if (found) {
        agent = found;
        companySource = { id: roster.company.id, name: roster.company.name, isPrimary: true };
      }
    }

    // Search custom companies
    if (!agent && existsSync(COMPANIES_PATH)) {
      const data = JSON.parse(readFileSync(COMPANIES_PATH, "utf-8"));
      for (const company of data.companies || []) {
        const found = (company.agents || []).find((a: any) => a.id === agentId);
        if (found) {
          agent = found;
          companySource = { id: company.id, name: company.name, isPrimary: false };
          break;
        }
      }
    }

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Find tasks assigned to this agent
    let tasks: any[] = [];
    if (existsSync(TASKS_PATH)) {
      const taskData = JSON.parse(readFileSync(TASKS_PATH, "utf-8"));
      tasks = (taskData.tasks || []).filter((t: any) => t.assigned_to === agentId);
    }

    return NextResponse.json({
      agent,
      company: companySource,
      tasks: tasks.map((t: any) => ({
        id: t.id, title: t.title, status: t.status,
        priority: t.priority, created_at: t.created_at,
      })),
      task_count: tasks.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
