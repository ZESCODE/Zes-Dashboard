import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

const exec = promisify(execFile);
const MANAGER = join(homedir(), ".hermes", "sync_manager.py");

async function runManager(...args: string[]): Promise<string> {
  try {
    const { stdout } = await exec("python3", [MANAGER, ...args]);
    return stdout.trim();
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

// GET /api/cloud — sync status + backup list
export async function GET() {
  try {
    const statusRaw = await runManager("status");
    const listRaw = await runManager("list");
    const status: any = {};
    const backups: any[] = [];

    // Parse status output
    for (const line of statusRaw.split("\n")) {
      if (line.startsWith("Last sync:")) status.lastSync = line.replace("Last sync: ", "").trim();
      if (line.startsWith("Total backups:")) status.totalBackups = parseInt(line.replace("Total backups: ", ""));
      if (line.startsWith("Backup dir:")) status.backupDir = line.replace("Backup dir: ", "").trim();
    }

    // Parse file statuses
    const files: any[] = [];
    for (const line of statusRaw.split("\n")) {
      const match = line.match(/^\s*([✓✗])\s+(\S+)\s+\((.+)\)$/);
      if (match) {
        files.push({ exists: match[1] === "✓", file: match[2], description: match[3] });
      }
    }
    status.files = files;

    // Parse backup list
    for (const line of listRaw.split("\n")) {
      const match = line.match(/^(\S+)\s+(\S+T\S+)\s+(\d+) files\s+([\d.]+)KB\s+\[(\w+)\]$/);
      if (match) {
        backups.push({
          id: match[1],
          timestamp: match[2],
          files: parseInt(match[3]),
          sizeKB: parseFloat(match[4]),
          status: match[5],
        });
      }
    }

    return NextResponse.json({ status, backups });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/cloud — create a backup
export async function POST() {
  try {
    const stdout = await runManager("backup");
    const match = stdout.match(/Backup (\S+): (\d+) files, (\d+) bytes/);
    return NextResponse.json({
      status: "ok",
      backupId: match?.[1] || "unknown",
      files: parseInt(match?.[2] || "0"),
      size: parseInt(match?.[3] || "0"),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
