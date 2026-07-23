import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const EVENTS_PATH = join(homedir(), ".hermes", "webhooks", "events.json");

function loadEvents(): { events: any[], total: number } {
  try {
    if (existsSync(EVENTS_PATH)) {
      return JSON.parse(readFileSync(EVENTS_PATH, "utf-8"));
    }
  } catch {}
  return { events: [], total: 0 };
}

function computeStats(events: any[]) {
  const now = Date.now();
  const oneDay = 86400000;
  const recent = events.filter((e: any) => {
    const ts = new Date(e.timestamp).getTime();
    return now - ts < oneDay;
  });
  const sources: Record<string, number> = {};
  const types: Record<string, number> = {};
  for (const e of events.slice(-100)) {
    sources[e.source] = (sources[e.source] || 0) + 1;
    types[e.type] = (types[e.type] || 0) + 1;
  }
  return {
    total: events.length,
    last_24h: recent.length,
    pending: events.filter((e: any) => e.status !== "processed").length,
    sources,
    types,
  };
}

export async function GET() {
  try {
    const data = loadEvents();
    const events = (data.events || []).slice(-50).reverse().map((e: any) => ({
      id: e.id,
      type: e.type,
      source: e.source,
      timestamp: e.timestamp,
      summary: e.payload?.message || "",
    }));
    const stats = computeStats(data.events || []);
    return NextResponse.json({ events, stats });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, events: [], stats: {} }, { status: 500 });
  }
}
