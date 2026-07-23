import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const SCRIPT = join(homedir(), ".hermes", "task_templates.py");

function runJson(...args: string[]): any {
  try {
    const cmd = `python3 "${SCRIPT}" --json ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`;
    const out = execSync(cmd, { timeout: 10000, encoding: "utf-8" });
    // Parse last JSON line (seed output may appear first)
    const lines = out.trim().split("\n").filter(l => l.startsWith("{") || l.startsWith("["));
    return JSON.parse(lines[lines.length - 1]);
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "list";

  switch (path) {
    case "list": {
      const cat = searchParams.get("category") || "";
      const search = searchParams.get("search") || "";
      return NextResponse.json(runJson("list", "--category", cat, "--search", search));
    }
    case "get": {
      const id = searchParams.get("id") || "0";
      return NextResponse.json(runJson("get", id));
    }
    case "stats":
      return NextResponse.json(runJson("stats"));
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
        const { name, category, description, content, variables, agent, tags } = params;
        if (!name || !content) {
          return NextResponse.json({ error: "name and content required" }, { status: 400 });
        }
        const args = ["add", name, category || "general", content];
        if (description) args.push("--desc", description);
        if (agent) args.push("--agent", agent);
        if (tags?.length) args.push("--tags", tags.join(","));
        return NextResponse.json(runJson(...args));
      }
      case "delete": {
        if (!params.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        return NextResponse.json(runJson("delete", String(params.id)));
      }
      case "instantiate": {
        if (!params.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const varsObj = params.variables || {};
        const args = ["instantiate", String(params.id)];
        for (const [k, v] of Object.entries(varsObj)) {
          args.push(`${k}=${String(v)}`);
        }
        return NextResponse.json(runJson(...args));
      }
      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
