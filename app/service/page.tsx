"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { ServiceStats } from "@/components/dashboard/service-stats";
import CuteRobotIcon from "@/components/icons/cute-robot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ServerIcon, TerminalIcon, AgentIcon, 
  NetworkIcon, DatabaseIcon, ChatIcon 
} from "@/components/icons/papirus";

const ICON_MAP: Record<string, any> = {
  "9router-proxy": NetworkIcon,
  "amux": AgentIcon,
  "claude-proxy": ChatIcon,
  "hermes": AgentIcon,
  "zes-dashboard": ServerIcon,
  "zes-flask-api": DatabaseIcon,
  "vscode-server": TerminalIcon,
  "ttyd": TerminalIcon,
  "cloudflare-tunnel": NetworkIcon,
  "tor": NetworkIcon,
  "chromium-cdp": TerminalIcon,
  "zes-memory-sync": DatabaseIcon,
  "hermes-webui": ChatIcon,
  "claude-dashboard": ChatIcon,
};

const PORT_MAP: Record<string, number> = {
  "9router-proxy": 20128, "amux": 8822, "claude-proxy": 5905,
  "zes-dashboard": 5050, "zes-flask-api": 5002, "hermes-webui": 8787,
  "claude-dashboard": 8788, "terminal": 7173, "vscode-server": 8000,
};

export default function ServicePage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch("http://localhost:5002/api/services");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setServices(list);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async (name: string) => {
    setActionLoading(name);
    try {
      await fetch(`http://localhost:5002/api/services/${name}/restart`, { method: "POST" });
      setTimeout(fetchServices, 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const running = services.filter((s: any) => s.status === "running").length;

  return (
    <DashboardPageLayout
      header={{
        title: "Services",
        description: "All runit services & system control",
        icon: CuteRobotIcon,
      }}
    >
      <ServiceStats className="mb-6" />

      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">Service Status</h2>
        <span className="text-xs text-muted-foreground font-normal">({services.length} total)</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading services...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
          {services.map((svc: any) => {
            const isRunning = svc.status === "running";
            const IconComponent = ICON_MAP[svc.name] || ServerIcon;
            const port = PORT_MAP[svc.name] || "";
            return (
              <div
                key={svc.name}
                className={cn(
                  "bg-card border rounded-xl p-3 flex justify-between items-center transition-all",
                  isRunning
                    ? "border-border/50 hover:border-success/30"
                    : "border-border/30 hover:border-border/60"
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <IconComponent className="text-indigo-400 shrink-0" size={18} />
                    <span className="text-sm font-semibold text-foreground truncate">{svc.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono pl-6">
                    {port ? `:${port}` : ""} · {svc.status}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      isRunning
                        ? "text-green-400 bg-green-500/15 border border-green-500/30"
                        : "text-red-400 bg-red-500/15 border border-red-500/30"
                    )}
                  >
                    {isRunning ? "● Run" : "▼ Down"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    disabled={actionLoading === svc.name}
                    onClick={() => handleRestart(svc.name)}
                  >
                    {actionLoading === svc.name ? "..." : "↻"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DashboardCard title="GUARD DOG PROTOCOL" intent="default">
        <div className="space-y-3">
          {[
            { label: "AUTO-RESTART", value: "ENABLED" },
            { label: "HEALTH CHECKS", value: "EVERY 10s" },
            { label: "RUNNING", value: `${running}/${services.length}` },
            { label: "NOTIFICATIONS", value: "ON FAILURE" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between bg-accent/20 rounded px-3 py-2">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <Badge variant="outline">{item.value}</Badge>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
