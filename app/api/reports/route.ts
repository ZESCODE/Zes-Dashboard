import { NextRequest, NextResponse } from "next/server";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, existsSync, readdirSync } from "fs";

const REPORT_PATH = join(homedir(), ".hermes", "review_report.json");
const LOG_DIR = join(homedir(), "logs", "hermes-review");

export async function GET() {
  try {
    // Read current report
    let report = null;
    if (existsSync(REPORT_PATH)) {
      report = JSON.parse(readFileSync(REPORT_PATH, "utf-8"));
    }

    // Read daemon log
    let logTail: string[] = [];
    const logFile = join(LOG_DIR, "daemon.log");
    if (existsSync(logFile)) {
      const content = readFileSync(logFile, "utf-8");
      const lines = content.trim().split("\n");
      logTail = lines.slice(-30); // last 30 lines
    }

    return NextResponse.json({
      report,
      log_tail: logTail,
      log_lines: logTail.length,
      healthy: report ? (
        report.summary?.budget_alerts === 0 &&
        report.summary?.stale_count === 0 &&
        !report.summary?.daily_alert
      ) : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
