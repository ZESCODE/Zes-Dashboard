import { NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const SCRIPT_PATH = join(homedir(), "Zes-System", "scripts", "memory_api.py");

export async function GET() {
  try {
    const out = execSync(`python3 "${SCRIPT_PATH}" stats`, { timeout: 8000 });
    const data = JSON.parse(out.toString().trim());
    return NextResponse.json({
      memories: [],
      facts: [],
      memory_count: data.total || 0,
      fact_count: data.types?.fact || 0,
      stats: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message, memories: [], facts: [], memory_count: 0, fact_count: 0 },
      { status: 500 }
    );
  }
}
