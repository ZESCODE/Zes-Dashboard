/**
 * ZES API Client — connects the dashboard to Flask backend (:5002)
 * Falls back gracefully when backend is unreachable.
 */

const API_BASE = "http://127.0.0.1:5002/api";

export interface ServiceHealth {
  name: string;
  port: number;
  running: boolean;
}

export interface SystemInfo {
  memory: { total: string; used: string; percent: number };
  disk: { total: string; used: string; percent: number };
  uptime: string;
  hostname: string;
  load: number[];
  cpu_cores: number;
  arch?: string;
  os?: string;
  android?: string;
  device?: string;
  manufacturer?: string;
  runtimes?: Record<string, string>;
  termux_version?: string;
}

export interface ServiceStatus {
  name: string;
  status: string;
  raw?: string;
}

export type FetchState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; error: string };

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function parseMemoryMB(raw: string): number {
  // Parse something like "Mem:           11752        7594          95          53        4062        3894"
  const m = raw.match(/^Mem:\s+(\d+)\s+(\d+)/);
  if (m) return Math.round(parseInt(m[2]) / 1024); // KB -> MB
  return 0;
}

function parseMemTotalMB(raw: string): number {
  const m = raw.match(/^Mem:\s+(\d+)/);
  if (m) return Math.round(parseInt(m[1]) / 1024);
  return 0;
}

function parseDiskFromLine(raw: string): { total: string; used: string; percent: number } {
  // Format: /dev/block/dm-55 228G 188G 40G 83% /path
  const parts = raw.trim().split(/\s+/);
  if (parts.length >= 5) {
    return {
      total: parts[1] || "—",
      used: parts[2] || "—",
      percent: parseInt(parts[4]) || 0,
    };
  }
  return { total: "—", used: "—", percent: 0 };
}

function parseLoad(raw: string): number[] {
  if (!raw) return [0, 0, 0];
  return raw.split(",").map((s: string) => parseFloat(s.trim())).filter((n) => !isNaN(n));
}

export async function getHealth(): Promise<ServiceHealth[] | null> {
  const data = await fetchJSON<{ services: Record<string, { port: number; running: boolean }> }>(`${API_BASE}/health`);
  if (!data?.services) return null;
  return Object.entries(data.services).map(([name, info]) => ({
    name,
    port: info.port,
    running: info.running,
  }));
}

export async function getSystemInfo(): Promise<SystemInfo | null> {
  const data = await fetchJSON<any>(`${API_BASE}/system`);
  if (!data) return null;

  // Parse memory from raw array output
  const memLines = data.memory || [];
  const memLine = memLines.find((l: string) => l.startsWith("Mem:")) || "";
  const memUsedMB = parseMemoryMB(memLine);
  const memTotalMB = parseMemTotalMB(memLine);
  const memPercent = memTotalMB > 0 ? Math.round((memUsedMB / memTotalMB) * 100) : 0;

  // Parse disk from raw array output
  const diskLines = data.disk || [];
  const diskLine = diskLines.find((l: string) => l.includes("/dev/")) || "";
  const diskParsed = parseDiskFromLine(diskLine);

  // Parse load
  const loadArr = parseLoad(data.load);

  return {
    memory: {
      total: `${memTotalMB}M`,
      used: `${memUsedMB}M`,
      percent: memPercent,
    },
    disk: {
      total: diskParsed.total,
      used: diskParsed.used,
      percent: diskParsed.percent,
    },
    uptime: (data.uptime || "—").replace(/^[\d:]+ up\s+/, "").replace(/,\s*$/, ""),
    hostname: data.hostname || "localhost",
    load: loadArr,
    cpu_cores: data.cpu_cores || 0,
    arch: data.arch,
    os: data.os,
    android: data.android,
    device: data.device,
    manufacturer: data.manufacturer,
    runtimes: data.runtimes,
    termux_version: data.termux_version,
  };
}

export async function getServices(): Promise<ServiceStatus[] | null> {
  const data = await fetchJSON<{ services: ServiceStatus[] }>(`${API_BASE}/services`);
  return data?.services ?? null;
}

export async function startService(name: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/services/${name}/start`, { method: "POST" });
  return res.ok;
}

export async function stopService(name: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/services/${name}/stop`, { method: "POST" });
  return res.ok;
}

// ── Proxy & Network Status ─────────────────────────────────────────

export interface ProxyStatus {
  tor: {
    socks5: boolean;
    httpProxy: boolean;
    exitIp: string | null;
  };
  rotator: {
    interval: string;
    service: string;
    running: boolean;
  };
  gateway: {
    r9: boolean;
    port: number;
  };
  model: {
    id: string;
    full: string;
  };
  proxyUrl: string;
}

export async function getProxyStatus(): Promise<ProxyStatus | null> {
  try {
    const res = await fetch("/api/proxy-status", { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return (await res.json()) as ProxyStatus;
  } catch {
    return null;
  }
}

/** Strip verbose suffixes for display: "deepseek-v4-flash-free" → "deepseek-v4" */
export function trimModelName(name: string): string {
  return name.replace(/-flash-free$/, "").replace(/-free$/, "").replace(/-mini$/, "-m");
}

/** Count running services from the services endpoint */
export async function countRunningServices(): Promise<{ total: number; running: number }> {
  const svcs = await getServices();
  if (!svcs) return { total: 0, running: 0 };
  return {
    total: svcs.length,
    running: svcs.filter((s) => s.status === "running").length,
  };
}
