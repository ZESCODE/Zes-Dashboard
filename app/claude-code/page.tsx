"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Square, Server, ExternalLink, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import CuteRobotIcon from "@/components/icons/cute-robot";

export default function ClaudeCodePage() {
  const [status, setStatus] = useState("checking");
  const [serviceInfo, setServiceInfo] = useState(null);
  const [result, setResult] = useState("");

  const checkStatus = async () => {
    setStatus("checking");
    try {
      const res = await fetch(`http://localhost:5905/`);
      setStatus(res.ok ? "running" : "error");
      setServiceInfo({ port: 5905, proxy: "9Router", endpoint: "http://localhost:5905" });
    } catch {
      setStatus("stopped");
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = status === "running" ? "success" : status === "stopped" ? "destructive" : "warning";

  return (
    <DashboardPageLayout header={{ title: "Claude Code", description: "AI coding agent via 9Router proxy", icon: CuteRobotIcon }}>
      <DashboardCard title="SERVICE STATUS" intent={status === "running" ? "success" : "default"}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg"
              )}>
                <Bot className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-display">Claude Code</h3>
                <p className="text-sm text-muted-foreground">9Router proxy (:5905) → Anthropic API</p>
              </div>
            </div>
            <Badge variant={status === "running" ? "default" : "secondary"} className={cn(
              "capitalize",
              status === "running" && "bg-success text-success-foreground"
            )}>
              {status === "running" ? "● Running" : status === "stopped" ? "○ Stopped" : "◌ Checking"}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => window.open("http://localhost:5905", "_blank")} variant="default" size="sm" className="gap-1">
              <ExternalLink className="h-4 w-4" /> Open Proxy
            </Button>
            <Button onClick={checkStatus} variant="ghost" size="sm">Refresh</Button>
          </div>

          {result && (
            <div className="bg-accent/20 rounded-lg px-3 py-2 text-sm font-mono text-muted-foreground">{result}</div>
          )}

          {serviceInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(serviceInfo).map(([key, val]) => (
                <div key={key} className="bg-accent/20 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{key}</div>
                  <div className="text-xs font-mono font-bold truncate">{String(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="PROXY ENDPOINTS" intent="default">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { port: 5905, name: "Claude Proxy", desc: "Anthropic-compatible API via 9Router" },
            { port: 20128, name: "9Router Gateway", desc: "Main LLM request router" },
          ].map(ep => (
            <div key={ep.port} className="flex items-center justify-between bg-accent/20 rounded-lg p-3">
              <div>
                <div className="text-sm font-medium">{ep.name}</div>
                <div className="text-xs text-muted-foreground">{ep.desc}</div>
              </div>
              <Badge variant="outline" className="font-mono">:{ep.port}</Badge>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
