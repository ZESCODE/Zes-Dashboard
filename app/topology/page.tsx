"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Monitor, Server, Database, Shield, Cpu, Globe, Lock, Wifi,
  ArrowRight, Zap, Bot, Router, Terminal, HardDrive, Cloud, Activity,
} from "lucide-react";
import { getHealth } from "@/lib/api-client";
import GearIcon from "@/components/icons/gear";

const services = [
  { id: "codex", label: "Codex CLI", icon: Bot, port: 5900, color: "from-blue-500 to-indigo-600", tier: 0 },
  { id: "claude", label: "Claude Code", icon: Terminal, port: 5905, color: "from-emerald-500 to-teal-600", tier: 0 },
  { id: "hermes", label: "Hermes Agent", icon: Zap, port: 0, color: "from-amber-500 to-orange-600", tier: 0 },
  { id: "9router", label: "9Router Gateway", icon: Router, port: 20128, color: "from-purple-500 to-violet-600", tier: 1 },
  { id: "amux", label: "Teams", icon: Monitor, port: 8822, color: "from-cyan-500 to-sky-600", tier: 1 },
  { id: "flask-api", label: "Flask API", icon: Database, port: 5002, color: "from-pink-500 to-rose-600", tier: 1 },
  { id: "zes-dashboard", label: "ZES :7070", icon: Monitor, port: 7070, color: "from-emerald-500 to-green-600", tier: 2 },
  { id: "memory-hub", label: "Memory Hub", icon: Database, port: 0, color: "from-teal-500 to-emerald-600", tier: 2 },
  { id: "vscode", label: "VS Code Server", icon: HardDrive, port: 8000, color: "from-sky-500 to-blue-600", tier: 2 },
  { id: "chromium", label: "Headless CDP", icon: Globe, port: 9222, color: "from-yellow-500 to-amber-600", tier: 2 },
  { id: "cloudflare", label: "Cloudflare", icon: Cloud, port: 0, color: "from-orange-500 to-red-600", tier: 2 },
];

export default function TopologyPage() {
  const [health, setHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const h = await getHealth();
        if (h) setHealth(h as any[]);
      } catch {}
      setLoading(false);
    };
    fetchHealth();
    const iv = setInterval(fetchHealth, 15000);
    return () => clearInterval(iv);
  }, []);

  const isServiceAlive = (id: string): boolean | null => {
    const match = health.find((h: any) =>
      h.name?.toLowerCase() === id.toLowerCase() ||
      h.service?.toLowerCase() === id.toLowerCase() ||
      h.id?.toLowerCase() === id.toLowerCase()
    );
    if (match !== undefined) return match.alive ?? match.status === "running" ?? match.ok ?? false;
    // For services without explicit health check, check port
    const svc = services.find((s) => s.id === id);
    if (svc && svc.port > 0) {
      const portMatch = health.find((h: any) => h.port === svc.port);
      return portMatch ? (portMatch.alive ?? false) : null;
    }
    // Known always-on services
    if (id === "memory-hub" || id === "hermes" || id === "zes-dashboard") return true;
    return null;
  };

  const getStatusColor = (alive: boolean | null) => {
    if (alive === true) return "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]";
    if (alive === false) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]";
    return "bg-muted-foreground/30";
  };

  const tiers = [
    { label: "Agent Layer", tier: 0, color: "border-l-blue-500/50" },
    { label: "Core Services", tier: 1, color: "border-l-purple-500/50" },
    { label: "Infrastructure", tier: 2, color: "border-l-emerald-500/50" },
  ];

  const online = services.filter((s) => isServiceAlive(s.id) === true).length;
  const offline = services.filter((s) => isServiceAlive(s.id) === false).length;
  const unknown = services.filter((s) => isServiceAlive(s.id) === null).length;

  const q = search.toLowerCase();
  const filteredServices = services.filter((s) =>
    q === "" || s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
  );

  return (
    <DashboardPageLayout
      header={{
        title: "Topology",
        description: `${online} online · ${offline} offline · ${unknown} unknown · ${services.length} total`,
        icon: GearIcon,
      }}
    >
      {/* Controls */}
      <div className="relative mb-6">
        <Activity className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter services..."
          className="w-full rounded-lg border border-border bg-accent/20 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading topology...</div>
      ) : (
        tiers.map((tier) => {
          const tierServices = filteredServices.filter((s) => s.tier === tier.tier);
          if (tierServices.length === 0) return null;
          return (
            <div key={tier.tier} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-1 h-4 rounded-full", tier.color.replace("border-l-", "bg-"))} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tier.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {tierServices.length} nodes
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tierServices.map((svc) => {
                  const alive = isServiceAlive(svc.id);
                  const Icon = svc.icon;
                  return (
                    <div
                      key={svc.id}
                      className={cn(
                        "relative rounded-xl border p-4 transition-all group",
                        alive === true
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : alive === false
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-border/30 bg-accent/5",
                        "hover:scale-[1.02] cursor-default"
                      )}
                    >
                      {/* Status dot */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <div className={cn("size-2 rounded-full", getStatusColor(alive))} />
                        <span className={cn(
                          "text-[8px] font-semibold uppercase font-mono",
                          alive === true ? "text-emerald-400" :
                          alive === false ? "text-red-400" : "text-muted-foreground/50"
                        )}>
                          {alive === true ? "ONLINE" : alive === false ? "OFFLINE" : "UNKNOWN"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "size-9 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                          svc.color
                        )}>
                          <Icon className="size-4 text-white" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{svc.label}</div>
                          <div className="text-[9px] text-muted-foreground font-mono">
                            {svc.port > 0 ? `:${svc.port}` : svc.id}
                          </div>
                        </div>
                      </div>

                      {/* Port badge */}
                      {svc.port > 0 && (
                        <div className="flex items-center gap-1">
                          <Wifi className="size-2.5 text-muted-foreground/50" />
                          <span className="text-[9px] text-muted-foreground/50 font-mono">
                            127.0.0.1:{svc.port}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-4 pt-4 border-t border-border/30">
        <span className="font-semibold uppercase tracking-wider">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" /> Online
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" /> Offline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/30" /> Unknown
        </span>
      </div>
    </DashboardPageLayout>
  );
}
