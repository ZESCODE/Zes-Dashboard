import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const ROADMAP_PATH = join(homedir(), ".hermes", "roadmap.json");

function ensureRoadmap() {
  const dir = join(homedir(), ".hermes");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(ROADMAP_PATH)) {
    const defaults = {
      goals: [
        {
          id: "g1", name: "System Foundation",
          description: "Stable, self-healing infrastructure for all ZES agents",
          progress: 72, status: "on_track",
          epics: [
            { id: "g1e1", name: "Service Reliability", kpi: "99% uptime", progress: 88, status: "on_track" },
            { id: "g1e2", name: "Memory Hub Consolidation", kpi: "Unified memory store", progress: 95, status: "completed" },
            { id: "g1e3", name: "Backup & Recovery", kpi: "Automated daily snapshots", progress: 45, status: "attention" },
          ],
        },
        {
          id: "g2", name: "Orchestration Engine",
          description: "Hermes-powered strategic dispatch for goals, tasks, and agents",
          progress: 34, status: "attention",
          epics: [
            { id: "g2e1", name: "Goal Decomposition", kpi: "Top-down roadmap engine", progress: 60, status: "on_track" },
            { id: "g2e2", name: "Task Queue & Dispatch", kpi: "Agent dispatch pipeline", progress: 25, status: "attention" },
            { id: "g2e3", name: "Budget Governor", kpi: "Token/cost tracking", progress: 10, status: "blocked" },
          ],
        },
        {
          id: "g3", name: "Agent Experience",
          description: "Seamless terminal UI across Hermes, Codex, and OpenClaude",
          progress: 58, status: "on_track",
          epics: [
            { id: "g3e1", name: "Unified Theme System", kpi: "Cross-agent design tokens", progress: 90, status: "completed" },
            { id: "g3e2", name: "Dashboard Port 7070", kpi: "ZES Orchestration Dashboard", progress: 75, status: "on_track" },
            { id: "g3e3", name: "Mobile UX", kpi: "Touch-first Termux experience", progress: 20, status: "attention" },
          ],
        },
        {
          id: "g4", name: "External Integration",
          description: "Connect ZES to the outside world via APIs, webhooks, and cloud",
          progress: 15, status: "blocked",
          epics: [
            { id: "g4e1", name: "OpenRouter Bridge", kpi: "GPT-4/o1 strategic advice", progress: 5, status: "blocked" },
            { id: "g4e2", name: "Webhook Relay", kpi: "GitHub/GitLab event pipeline", progress: 30, status: "attention" },
            { id: "g4e3", name: "Cloud Sync", kpi: "Encrypted off-device backup", progress: 10, status: "blocked" },
          ],
        },
      ],
      updated: new Date().toISOString(),
    };
    writeFileSync(ROADMAP_PATH, JSON.stringify(defaults, null, 2));
  }
}

export async function GET() {
  try {
    ensureRoadmap();
    const data = JSON.parse(readFileSync(ROADMAP_PATH, "utf-8"));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    data.updated = new Date().toISOString();
    ensureRoadmap();
    writeFileSync(ROADMAP_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ status: "ok", updated: data.updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
