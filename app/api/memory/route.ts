import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const SCRIPT = join(homedir(), "Zes-Dashboard", "scripts", "memory_api.py");

function run(...args: string[]): any {
  try {
    const cmd = `python3 "${SCRIPT}" ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`;
    const out = execSync(cmd, { timeout: 10000, encoding: "utf-8" });
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

    case "entities":
      return NextResponse.json(run("entities"));

    case "memories":
      const mlimit = parseInt(searchParams.get("limit") || "50");
      const moffset = parseInt(searchParams.get("offset") || "0");
      const mq = searchParams.get("q") || "";
      return NextResponse.json(run("memories", String(mlimit), String(moffset), mq));

    case "banks":
      return NextResponse.json(run("banks"));

    default:
      return NextResponse.json({ error: "unknown path" }, { status: 400 });
  }
}
