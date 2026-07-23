import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const SCRIPT = join(homedir(), ".hermes", "events_bus.py");

function runJson(...args: string[]): any {
  try {
    const cmd = `python3 "${SCRIPT}" --json ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`;
    const out = execSync(cmd, { timeout: 8000, encoding: "utf-8" });
    return JSON.parse(out.trim());
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "list";

  switch (path) {
    case "list": {
      const limit = searchParams.get("limit") || "50";
      const source = searchParams.get("source") || "";
      const type = searchParams.get("type") || "";
      return NextResponse.json(runJson("list", limit, source, type));
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
    const { source, type, payload, agent } = body;
    if (!source || !type || !payload) {
      return NextResponse.json({ error: "source, type, and payload required" }, { status: 400 });
    }
    const args = ["publish", source, type];
    for (const [k, v] of Object.entries(payload)) {
      args.push(`${k}=${String(v)}`);
    }
    if (agent) args.push(`agent=${agent}`);
    return NextResponse.json(runJson(...args));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
