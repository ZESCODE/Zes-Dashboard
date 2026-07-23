import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

const MGR_PATH = join(homedir(), ".hermes", "companies_manager.py");
const COMPANIES_PATH = join(homedir(), ".hermes", "companies.json");
const ROSTER_PATH = join(homedir(), ".hermes", "roster.json");

const execAsync = promisify(execFile);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    // Check primary company first
    if (existsSync(ROSTER_PATH)) {
      const roster = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));
      if (roster.company && roster.company.id === companyId) {
        return NextResponse.json({
          ...roster.company,
          agents: roster.agents || [],
          budget_policies: roster.budget_policies || [],
          isPrimary: true,
        });
      }
    }

    // Check custom companies
    if (existsSync(COMPANIES_PATH)) {
      const data = JSON.parse(readFileSync(COMPANIES_PATH, "utf-8"));
      const company = (data.companies || []).find((c: any) => c.id === companyId);
      if (company) {
        return NextResponse.json({ ...company, isPrimary: false });
      }
    }

    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    // Cannot delete primary company
    if (existsSync(ROSTER_PATH)) {
      const roster = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));
      if (roster.company && roster.company.id === companyId) {
        return NextResponse.json(
          { error: "Cannot delete the primary company" },
          { status: 400 }
        );
      }
    }

    const { stdout, stderr } = await execAsync("python3", [
      MGR_PATH, "delete", companyId,
    ]);

    if (stderr) console.warn("delete stderr:", stderr);

    return NextResponse.json({ status: "ok", message: stdout.trim() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
