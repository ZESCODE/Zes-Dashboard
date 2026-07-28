/**
 * ZES API Client — connects the dashboard to Flask backend (:5002)
 * Falls back to mock data when backend is unreachable.
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
  return fetchJSON<SystemInfo>(`${API_BASE}/system`);
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

// ── Agent Playground API ──

import type { ApiRequest, ApiResponse, AgentConfig } from "@/types/dashboard";
import { ROUTER_API, AMUX_API } from "@/lib/constants";

export async function proxyApiRequest(request: ApiRequest): Promise<ApiResponse> {
  const start = performance.now();
  try {
    const res = await fetch(`${ROUTER_API}${request.endpoint}`, {
      method: request.method,
      headers: { "Content-Type": "application/json", ...request.headers },
      body: request.method !== "GET" ? request.body : undefined,
    });
    const timing = Math.round(performance.now() - start);
    const body = await res.text();
    let tokenUsage: ApiResponse["tokenUsage"];
    try {
      const j = JSON.parse(body);
      if (j.usage) tokenUsage = j.usage;
    } catch {}
    return { status: res.status, statusText: res.statusText, body, timing, tokenUsage };
  } catch (e) {
    return { status: 0, statusText: (e as Error).message, body: "", timing: 0 };
  }
}

export async function createAmuxSession(config: AgentConfig): Promise<{ ok: boolean; error?: string; name?: string }> {
  try {
    const res = await fetch(`${AMUX_API}/sessions/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function getModels(): Promise<{ models: import("@/types/dashboard").Model[] }> {
  try {
    const res = await fetch(`${ROUTER_API}/models`);
    return await res.json();
  } catch {
    return { models: [] };
  }
}
