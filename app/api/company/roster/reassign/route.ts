import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const ROSTER_PATH = join(homedir(), ".hermes", "roster.json");

export async function POST(request: NextRequest) {
  try {
    const { agentId, newParentId } = await request.json();
    if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

    const roster = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));
    const agent = roster.agents.find((a: any) => a.id === agentId);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    if (newParentId) {
      const parent = roster.agents.find((a: any) => a.id === newParentId);
      if (!parent) return NextResponse.json({ error: "Parent agent not found" }, { status: 404 });
      // Prevent circular: make sure newParentId is not a descendant of agentId
      const descendants = new Set<string>();
      function collectDescendants(id: string) {
        for (const a of roster.agents) {
          if (a.reportsTo === id && !descendants.has(a.id)) {
            descendants.add(a.id);
            collectDescendants(a.id);
          }
        }
      }
      collectDescendants(agentId);
      if (descendants.has(newParentId)) {
        return NextResponse.json({ error: "Cannot reassign to a descendant (circular)" }, { status: 400 });
      }
    }

    agent.reportsTo = newParentId || null;
    writeFileSync(ROSTER_PATH, JSON.stringify(roster, null, 2));

    // Also update companies.json if this agent is in a custom company
    try {
      const companiesPath = join(homedir(), ".hermes", "companies.json");
      if (existsSync(companiesPath)) {
        const companies = JSON.parse(readFileSync(companiesPath, "utf-8"));
        for (const co of [companies.primary, ...(companies.companies || [])]) {
          if (co) {
            const ca = (co.agents || []).find((a: any) => a.id === agentId);
            if (ca) {
              ca.reportsTo = newParentId || null;
            }
          }
        }
        writeFileSync(companiesPath, JSON.stringify(companies, null, 2));
      }
    } catch {}

    return NextResponse.json({
      status: "ok",
      agent: { id: agentId, reportsTo: newParentId || null },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}