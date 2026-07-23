import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, existsSync, writeFileSync } from "fs";

const MGR_PATH = join(homedir(), ".hermes", "tasks_manager.py");
const TASKS_PATH = join(homedir(), ".hermes", "tasks.json");

const execAsync = promisify(execFile);

function readTasks(): any[] {
  if (!existsSync(TASKS_PATH)) return [];
  try {
    const data = JSON.parse(readFileSync(TASKS_PATH, "utf-8"));
    return data.tasks || [];
  } catch { return []; }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const agent = searchParams.get("agent");

  const args = [MGR_PATH, "list"];
  if (status) { args.push("--status", status); }
  if (agent) { args.push("--agent", agent); }

  try {
    const tasks = readTasks();
    // Filter
    let filtered = tasks;
    if (status) filtered = filtered.filter((t: any) => t.status === status);
    if (agent) filtered = filtered.filter((t: any) => t.assigned_to === agent);

    // Get stats
    const statsArgs = [MGR_PATH, "stats"];
    const { stdout: statsOut } = await execAsync("python3", statsArgs);

    return NextResponse.json({
      tasks: filtered,
      stats: {
        total: filtered.length,
        pending: filtered.filter((t: any) => t.status === "pending").length,
        running: filtered.filter((t: any) => t.status === "running").length,
        done: filtered.filter((t: any) => t.status === "done" || t.status === "completed").length,
        failed: filtered.filter((t: any) => t.status === "failed").length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, agent, priority, company_id, status } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const args = [MGR_PATH, "create", title.trim()];
    if (description) { args.push("--description", description); }
    if (agent) { args.push("--agent", agent); }
    if (priority) { args.push("--priority", String(Math.max(1, Math.min(5, priority)))); }
    if (company_id) { args.push("--company", company_id); }

    const { stdout, stderr } = await execAsync("python3", args);
    if (stderr) console.warn("tasks_manager stderr:", stderr);

    // Parse the created task ID from output
    const match = stdout.match(/#(\d+)/);
    const taskId = match ? match[1] : null;

    let task = null;
    if (taskId) {
      const { stdout: taskJson } = await execAsync("python3", [MGR_PATH, "get", taskId]);
      try { task = JSON.parse(taskJson); } catch {}
    }

    // If status was provided, update immediately
    if (task && status && status !== "pending") {
      await execAsync("python3", [MGR_PATH, "update", taskId, "--status", status]);
      if (taskId) {
        const { stdout: updatedJson } = await execAsync("python3", [MGR_PATH, "get", taskId]);
        try { task = JSON.parse(updatedJson); } catch {}
      }
    }

    return NextResponse.json({ status: "ok", task, task_id: taskId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, note, agent } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const args = [MGR_PATH, "update", id];
    if (status) { args.push("--status", status); }
    if (note) { args.push("--note", note); }
    if (agent) { args.push("--agent", agent); }

    const { stdout, stderr } = await execAsync("python3", args);
    if (stderr) console.warn("tasks_manager stderr:", stderr);

    let task = null;
    const { stdout: taskJson } = await execAsync("python3", [MGR_PATH, "get", id]);
    try { task = JSON.parse(taskJson); } catch {}

    return NextResponse.json({ status: "ok", task, message: stdout.trim() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }
    const { stdout } = await execAsync("python3", [MGR_PATH, "delete", id]);
    return NextResponse.json({ status: "ok", message: stdout.trim() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
