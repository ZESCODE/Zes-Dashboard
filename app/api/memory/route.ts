import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const SCRIPT = join(homedir(), "Zes-System", "scripts", "memory_api.py");

function run(...args: string[]): any {
  try {
    const cmd = `python3 "${SCRIPT}" ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`;
    const out = execSync(cmd, { timeout: 15000, encoding: "utf-8" });
    return JSON.parse(out.trim());
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "stats";

  switch (path) {
    case "stats":
      return NextResponse.json(run("stats"));

    case "facts":
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      const search = searchParams.get("q") || "";
      const sort = searchParams.get("sort") || "trust_desc";
      return NextResponse.json(run("facts", String(limit), String(offset), search, sort));

    case "memories":
      const mlimit = parseInt(searchParams.get("limit") || "50");
      const moffset = parseInt(searchParams.get("offset") || "0");
      const mq = searchParams.get("q") || "";
      return NextResponse.json(run("memories", String(mlimit), String(moffset), mq));

    case "search":
      const query = searchParams.get("q") || "";
      return NextResponse.json(run("search", query));

    default:
      return NextResponse.json({ error: "unknown path" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, content, tags, type, scope, priority, source } = body;

    if (action === "insert") {
      const result = run("insert", type || "fact", scope || "global", priority || "medium", content || "", tags || "", source || "dashboard");
      return NextResponse.json(result);
    }

    if (action === "update") {
      const result = run("update", String(id), content || "", tags || "");
      return NextResponse.json(result);
    }

    if (action === "delete") {
      const result = run("delete", String(id));
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
