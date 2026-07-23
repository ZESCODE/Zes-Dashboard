import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

const execAsync = promisify(execFile);
const TRACKER_PATH = join(homedir(), ".hermes", "token_tracker.py");
const STATE_PATH = join(homedir(), ".hermes", "token_state.json");
const ROADMAP_PATH = join(homedir(), ".hermes", "roadmap.json");

function getTrackerData(): any {
  const state = existsSync(STATE_PATH)
    ? JSON.parse(readFileSync(STATE_PATH, "utf-8"))
    : { epic_totals: {}, day_total: 0, date: "" };
  const roadmap = existsSync(ROADMAP_PATH)
    ? JSON.parse(readFileSync(ROADMAP_PATH, "utf-8"))
    : { goals: [], total_tokens_used_all_epics: 0 };
  return { state, roadmap };
}

export async function GET() {
  try {
    // Run tracker status and parse JSON output
    const trackerData = getTrackerData();
    const roadmap = trackerData.roadmap;
    const state = trackerData.state;

    // Build epics data from roadmap
    const epics: any[] = [];
    for (const goal of roadmap.goals || []) {
      for (const epic of goal.epics || []) {
        epics.push({
          id: epic.id,
          goal_id: goal.id,
          name: epic.name,
          kpi: epic.kpi || "",
          status: epic.status,
          tokens_used: epic.tokens_used || 0,
          percent_budget: epic.tokens_used
            ? parseFloat(((epic.tokens_used / 500000) * 100).toFixed(1))
            : 0,
          last_updated: epic.last_updated || "",
          progress: epic.progress || 0,
        });
      }
    }

    return NextResponse.json({
      total_tokens: roadmap.total_tokens_used_all_epics || 0,
      day_tokens: state.day_total || 0,
      day_budget: 2000000,
      day_percent: state.day_total
        ? parseFloat(((state.day_total / 2000000) * 100).toFixed(1))
        : 0,
      active_epic: roadmap.active_epic_id || null,
      epics,
      last_review: roadmap.last_review || "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { epic_id, tokens } = body;

    if (!epic_id || typeof tokens !== "number" || tokens <= 0) {
      return NextResponse.json(
        { error: "Requires { epic_id: string, tokens: number } with tokens > 0" },
        { status: 400 },
      );
    }

    // Call the Python tracker
    const { stdout, stderr } = await execAsync("python3", [
      TRACKER_PATH,
      "add",
      epic_id,
      String(Math.round(tokens)),
    ]);

    if (stderr) {
      console.warn("Tracker stderr:", stderr);
    }

    // Parse output to confirm success
    return NextResponse.json({
      status: "ok",
      message: stdout.trim().split("\n")[0] || `Added ${tokens} tokens to ${epic_id}`,
      epic_id,
      tokens_added: tokens,
    });
  } catch (e: any) {
    // If the tracker threw EpicNotFoundError
    if (e.stderr?.includes("EpicNotFoundError") || e.stderr?.includes("not found in roadmap")) {
      return NextResponse.json(
        { error: `Epic not found. Run: python3 ${TRACKER_PATH} status to see available epics.` },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
