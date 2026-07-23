"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, Globe, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NetInterface {
  interface: string;
  address: string;
}

interface NetStat {
  interface: string;
  address: string;
  type?: string;
}

export default function NetworkPage() {
  const [interfaces, setInterfaces] = useState<NetInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5002/api/network");
      if (res.ok) {
        const data = await res.json();
        setInterfaces(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardPageLayout
      header={{
        title: "Network",
        description: "Network interfaces & addresses",
        icon: Globe,
      }}
    >
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: "Interfaces", value: interfaces.length.toString(), icon: Wifi, color: "text-cyan-400" },
          { label: "IPv4 Addrs", value: interfaces.filter(i => i.address.includes(".")).length.toString(), icon: Globe, color: "text-blue-400" },
          { label: "Services", value: "28", icon: Server, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="bg-accent/20 rounded-lg p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.color)} />
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-lg font-display font-bold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Interface List */}
      <DashboardCard
        title="NETWORK INTERFACES"
        intent="default"
        addon={
          <Button variant="ghost" size="icon" onClick={fetchNetwork}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        }
      >
        {loading && interfaces.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading network info...</div>
        ) : interfaces.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No network interfaces found</div>
        ) : (
          <div className="space-y-2">
            {interfaces.map((iface, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-accent/10 rounded-lg px-4 py-3 border border-border/40 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-8 rounded-lg flex items-center justify-center",
                    iface.address.includes(".") ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    <Wifi className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-display">{iface.interface}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {iface.address.includes(":") ? "IPv6" : "IPv4"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-accent/30 px-2 py-1 rounded">{iface.address}</code>
                  <Badge variant="outline" className="text-[10px]">
                    {iface.address.includes(".") ? "v4" : "v6"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Port Services Info */}
      <DashboardCard title="SERVICE PORTS" intent="default" className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { port: 5002, service: "Flask API" },
            { port: 5173, service: "Vite Dashboard" },
            { port: 7070, service: "ZES OS Next" },
            { port: 20128, service: "9Router" },
            { port: 5900, service: "Codex" },
            { port: 8788, service: "Claude Dashboard" },
            { port: 7173, service: "Terminal" },
            { port: 8822, service: "teams" },
            { port: 5905, service: "Claude Proxy" },
            { port: 5300, service: "Bridge" },
          ].map((svc) => (
            <div key={svc.port} className="bg-accent/10 rounded-lg px-3 py-2 border border-border/30">
              <div className="text-[10px] text-muted-foreground font-mono">:{svc.port}</div>
              <div className="text-xs font-medium">{svc.service}</div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
