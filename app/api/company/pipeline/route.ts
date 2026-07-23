import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const SCRIPT = join(homedir(), ".hermes", "pipeline_manager.py");

function runJson(...args: string[]): any {
  try {
    const cmd = `python3 "${SCRIPT}" --json ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`;
    const out = execSync(cmd, { timeout: 10000, encoding: "utf-8" });
    const lines = out.trim().split("\n").filter(l => l.startsWith("{") || l.startsWith("["));
    return JSON.parse(lines[lines.length - 1]);
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company");
  const path = searchParams.get("path") || "get";

  if (!companyId) {
    return NextResponse.json({ error: "company query parameter required" }, { status: 400 });
  }

  switch (path) {
    case "get":
      return NextResponse.json(runJson("get", companyId));
    case "roster":
      return NextResponse.json(runJson("roster", companyId));
    case "feedback": {
      const itemId = searchParams.get("item_id");
      const args = ["feedback", companyId];
      if (itemId) args.push(itemId);
      return NextResponse.json(runJson(...args));
    }
    default:
      return NextResponse.json({ error: "unknown path" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, company, ...params } = body;

    if (!company) {
      return NextResponse.json({ error: "company required" }, { status: 400 });
    }

    switch (action) {
      case "ensure":
        return NextResponse.json(runJson("ensure", company));

      case "add_item": {
        const { title, description, item_type, priority } = params;
        if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
        return NextResponse.json(runJson("add", company, title, description || "", item_type || "task", String(priority || 3)));
      }

      case "advance": {
        const { item_id, to_stage } = params;
        if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
        const args = ["advance", company, String(item_id)];
        if (to_stage) args.push(to_stage);
        return NextResponse.json(runJson(...args));
      }

      case "feedback": {
        const { item_id, author, comment, decision } = params;
        if (!item_id || !author || !comment) {
          return NextResponse.json({ error: "item_id, author, and comment required" }, { status: 400 });
        }
        return NextResponse.json(runJson("feedback", company, String(item_id), author, comment, decision || "comment"));
      }

      case "update_roster": {
        const { agents } = params;
        if (!agents || !Array.isArray(agents)) {
          return NextResponse.json({ error: "agents array required" }, { status: 400 });
        }
        return NextResponse.json(runJson("update-roster", company, JSON.stringify(agents)));
      }

      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
