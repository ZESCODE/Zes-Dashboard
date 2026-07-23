import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const SCRIPT = join(homedir(), ".hermes", "agent_scheduler.py");

function runJson(...args: string[]): any {
  try {
    const cmd = `python3 "${SCRIPT}" --json ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`;
    const out = execSync(cmd, { timeout: 10000, encoding: "utf-8" });
    return JSON.parse(out.trim());
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "list";

  switch (path) {
    case "list":
      return NextResponse.json(runJson("list"));
    case "stats":
      return NextResponse.json(runJson("stats"));
    case "get": {
      const id = searchParams.get("id") || "0";
      return NextResponse.json(runJson("get", id));
    }
    default:
      return NextResponse.json({ error: "unknown path" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case "add": {
        const { name, cron, task_template, agent, description } = params;
        if (!name || !cron || !task_template) {
          return NextResponse.json({ error: "name, cron, and task_template required" }, { status: 400 });
        }
        const args = ["add", name, cron, task_template];
        if (agent) { args.push("--agent", agent); }
        if (description) { args.push("--desc", description); }
        return NextResponse.json(runJson(...args));
      }
      case "update": {
        const { id, ...updates } = params;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const args = ["update", String(id)];
        for (const [k, v] of Object.entries(updates)) {
          args.push(`--${k}`, String(v));
        }
        return NextResponse.json(runJson(...args));
      }
      case "delete": {
        if (!params.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        return NextResponse.json(runJson("delete", String(params.id)));
      }
      case "run": {
        if (!params.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        return NextResponse.json(runJson("run", String(params.id)));
      }
      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
