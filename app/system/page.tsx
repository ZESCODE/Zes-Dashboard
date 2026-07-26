"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import ProcessorIcon from "@/components/icons/proccesor";
import { getSystemInfo, type SystemInfo } from "@/lib/api-client";
import { getProxyStatus, type ProxyStatus, trimModelName, countRunningServices } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import WiringDiagram from "@/components/wireflow/wiring-diagram";
import OrgChart, { OrgNode } from "@/components/dashboard/org-chart";

type SvcCount = { total: number; running: number };

export default function SystemPage() {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [proxy, setProxy] = useState<ProxyStatus | null>(null);
  const [svcCount, setSvcCount] = useState<SvcCount | null>(null);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleString());
    const fetchAll = () => {
      getSystemInfo().then(setSysInfo);
      getProxyStatus().then(setProxy);
      countRunningServices().then(setSvcCount);
      tick();
    };
    tick();
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, []);

  const memPercent = sysInfo?.memory.percent ?? 0;
  const diskPercent = sysInfo?.disk.percent ?? 0;
  const loadArr = sysInfo?.load ?? [0, 0, 0];
  const cores = sysInfo?.cpu_cores || 8;
  const cpuPct = Math.min(Math.round((loadArr[0] / cores) * 100), 100);

  const torOk = proxy?.tor.httpProxy;
  const exitIp = proxy?.tor.exitIp;
  const modelId = trimModelName(proxy?.model?.full || "deepseek-v4-flash-free");

  return (
    <DashboardPageLayout
      header={{
        title: "System",
        description: time ? `Updated ${time}` : undefined,
        icon: ProcessorIcon,
      }}
    >
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "CPU", value: `${cpuPct}%`, frost: cpuPct > 80 ? "red" : cpuPct > 50 ? "orange" : "green" },
          { label: "MEMORY", value: `${memPercent}%`, frost: memPercent > 80 ? "red" : memPercent > 60 ? "orange" : "green" },
          { label: "DISK", value: `${diskPercent}%`, frost: diskPercent > 85 ? "red" : diskPercent > 70 ? "orange" : "green" },
          { label: "LOAD", value: loadArr[0]?.toFixed(1) ?? "0.0", frost: loadArr[0] > cores ? "red" : "green" },
        ].map((stat) => (
          <div key={stat.label} className={cn("rounded-xl p-4", `glass-frost-${stat.frost}`)}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</div>
            <div className={cn(
              "text-2xl font-display",
              stat.frost === "red" ? "text-red-400" : stat.frost === "orange" ? "text-orange-400" : "text-emerald-400"
            )}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Proxy & Network Status Card */}
      <DashboardCard title="NETWORK & PROXY" frost="blue" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Tor Exit IP */}
          <div className={torOk ? "glass-frost-green rounded-xl p-3" : "glass-frost-red rounded-xl p-3"}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tor IP</div>
            <div className="font-mono text-sm font-bold flex items-center gap-2">
              <span className={cn(
                "inline-block w-2 h-2 rounded-full",
                torOk ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              )} />
              {exitIp ?? "—"}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">
              Rotates every 15 min via zes-ip-rotator
            </div>
          </div>

          {/* Proxy Status */}
          <div className={torOk ? "glass-frost-green rounded-xl p-3" : "glass-frost-red rounded-xl p-3"}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Proxy</div>
            <div className="font-mono text-sm font-bold flex items-center gap-2">
              <span className={cn(
                "inline-block w-2 h-2 rounded-full",
                torOk ? "bg-emerald-500" : "bg-red-500"
              )} />
              {torOk ? "Tor HTTP :8118" : "Offline"}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">
              SOCKS5 :9050 {proxy?.tor.socks5 ? "●" : "○"}
            </div>
          </div>

          {/* Active Model */}
          <div className="bg-accent/30 rounded p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Model</div>
            <div className="font-mono text-sm font-bold">{modelId}</div>
            <div className="text-[9px] text-muted-foreground mt-1 truncate" title={proxy?.model?.full}>
              {proxy?.model?.full ?? "deepseek-v4-flash-free"}
            </div>
          </div>

          {/* Running Tasks / Services */}
          <div className="bg-accent/30 rounded p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tasks</div>
            <div className="font-mono text-sm font-bold">
              {svcCount ? (
                <span className={cn(
                  svcCount.running < svcCount.total ? "text-warning" : "text-success"
                )}>
                  {svcCount.running}/{svcCount.total}
                </span>
              ) : (
                "—"
              )}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">
              {svcCount ? `${svcCount.total - svcCount.running} stopped` : "services"}
            </div>
          </div>
        </div>

        {/* Rate limit indicator */}
        <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground border-t border-border/30 pt-3">
          <span className="flex items-center gap-1">
            <span className={cn(
              "inline-block w-1.5 h-1.5 rounded-full",
              torOk ? "bg-success" : "bg-muted"
            )} />
            Gateway: {proxy?.gateway.r9 ? "9Router :20128" : "offline"}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
            IP Rotator: {proxy?.rotator.interval}
          </span>
        </div>
      </DashboardCard>

      {/* Resource bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DashboardCard title="MEMORY" frost={memPercent > 80 ? "red" : memPercent > 60 ? "orange" : "green"}>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-mono font-bold">{sysInfo?.memory.used ?? "—"}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", memPercent > 80 ? "bg-red-500" : memPercent > 60 ? "bg-orange-500" : "bg-emerald-500")} style={{ width: `${memPercent}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono">{sysInfo?.memory.total ?? "—"}</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="DISK" frost={diskPercent > 85 ? "red" : diskPercent > 70 ? "orange" : "green"}>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-mono font-bold">{sysInfo?.disk.used ?? "—"}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", diskPercent > 85 ? "bg-red-500" : diskPercent > 70 ? "bg-orange-500" : "bg-emerald-500")} style={{ width: `${diskPercent}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono">{sysInfo?.disk.total ?? "—"}</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* System Info Grid */}
      <DashboardCard title="SYSTEM INFO" frost="blue">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Hostname", value: sysInfo?.hostname ?? "—" },
            { label: "Arch", value: sysInfo?.arch ?? "—" },
            { label: "Device", value: sysInfo?.device ?? "—" },
            { label: "Android", value: sysInfo?.android ?? "—" },
            { label: "Kernel", value: sysInfo?.os?.replace("Linux ", "").split(" ")[0] ?? "—", sub: "linux" },
            { label: "Uptime", value: sysInfo?.uptime ?? "—" },
            { label: "Cores", value: `${sysInfo?.cpu_cores ?? "—"}` },
            { label: "Load (1/5/15)", value: loadArr.map((l: number) => l.toFixed(1)).join(" / ") },
            { label: "Manufacturer", value: sysInfo?.manufacturer ?? "—" },
            { label: "Termux", value: sysInfo?.termux_version ?? "—" },
            { label: "Python", value: sysInfo?.runtimes?.python?.replace("Python ", "") ?? "—" },
            { label: "Node", value: sysInfo?.runtimes?.node ?? "—" },
            { label: "Git", value: sysInfo?.runtimes?.git?.replace("git version ", "") ?? "—" },
            { label: "NPM", value: sysInfo?.runtimes?.npm ?? "—" },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
              <div className="font-mono text-sm font-bold truncate text-blue-400">{item.value}</div>
              {(item as any).sub && <div className="text-[9px] text-muted-foreground">{(item as any).sub}</div>}
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* ── System Architecture ── */}
      <details className="group mt-8">
        <summary className="cursor-pointer text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 mb-4">
          <span className="inline-block size-1.5 rounded-full bg-primary/60" />
          System Architecture
          <span className="text-[10px] text-muted-foreground/50 font-mono">click to expand</span>
        </summary>
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden" style={{ height: 400 }}>
            <WiringDiagram />
          </div>
          <div className="rounded-xl border border-border overflow-hidden p-4" style={{ minHeight: 350 }}>
            <OrgChart
              nodes={[
                { id: "system", name: "ZES System", role: "lead", title: "Orchestrator", status: "running", budgetMonthlyCents: 0, spentMonthCents: 0, reports: [
                  { id: "agents", name: "Agent Layer", role: "assistant", title: "Codex · Claude · Hermes", status: "running", budgetMonthlyCents: 0, spentMonthCents: 0, reports: [] },
                  { id: "gateway", name: "Gateway", role: "assistant", title: "9Router · Teams", status: "running", budgetMonthlyCents: 0, spentMonthCents: 0, reports: [] },
                  { id: "infra", name: "Infrastructure", role: "assistant", title: "Memory · CDP · VS Code", status: "running", budgetMonthlyCents: 0, spentMonthCents: 0, reports: [] }
                ]}
              ]}
              compact
            />
          </div>
        </div>
      </details>

    </DashboardPageLayout>
  );
}
