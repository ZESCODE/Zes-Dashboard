"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Activity,
  RefreshCw,
} from "lucide-react";
import AtomIcon from "@/components/icons/atom";

interface Report {
  timestamp: string;
  summary: {
    total_epics: number;
    active_epic: string | null;
    total_tokens: number;
    day_tokens: number;
    day_percent: number;
    stale_count: number;
    budget_alerts: number;
    daily_alert: boolean;
  };
  stale_epics: any[];
  budget_alerts: any[];
  daily_alert: any | null;
  epics: any[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [logTail, setLogTail] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setLogTail(data.log_tail || []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const healthy = report ? (
    report.summary.budget_alerts === 0 &&
    report.summary.stale_count === 0 &&
    !report.summary.daily_alert
  ) : null;

  return (
    <DashboardPageLayout
      header={{
        title: "Reports",
        description: "Background Reviews · System Health · Budget Alerts",
        icon: Shield,
        actions: (
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={fetchData}>
            <RefreshCw className="size-3 mr-1" /> REFRESH
          </Button>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading reports...</div>
        </div>
      ) : !report ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Shield className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No review reports yet</p>
          <div className="text-xs text-muted-foreground/70 text-center max-w-md">
            <p>Generate a system health review to see the first report.</p>
            <code className="block mt-2 text-[10px] bg-accent/10 rounded px-2 py-1 font-mono">
              python3 ~/.hermes/background_review.py
            </code>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.location.reload()}>
              <RefreshCw className="size-3 mr-1" /> Check Again
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Health Status */}
          <div className={cn(
            "rounded-lg border p-4 mb-6 flex items-center gap-3",
            healthy ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
          )}>
            {healthy ? (
              <CheckCircle2 className="size-8 text-success" />
            ) : (
              <AlertTriangle className="size-8 text-warning" />
            )}
            <div>
              <div className="text-sm font-medium">
                {healthy ? "All Systems Healthy" : "Issues Detected"}
              </div>
              <div className="text-xs text-muted-foreground">
                Last review: {new Date(report.timestamp).toLocaleString()}
                {!healthy && ` · ${report.summary.budget_alerts} budget alerts, ${report.summary.stale_count} stale epics`}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-accent/15 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Tokens</div>
              <div className="text-xl font-display font-bold">{(report.summary.total_tokens || 0).toLocaleString()}</div>
            </div>
            <div className="bg-accent/15 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Today</div>
              <div className="text-xl font-display font-bold">{(report.summary.day_tokens || 0).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">{report.summary.day_percent}% of daily budget</div>
            </div>
            <div className="bg-accent/15 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Epics</div>
              <div className="text-xl font-display font-bold">{report.summary.total_epics}</div>
              <div className="text-[10px] text-muted-foreground">{report.summary.active_epic ? `Active: ${report.summary.active_epic}` : "No active epic"}</div>
            </div>
            <div className="bg-accent/15 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Issues</div>
              <div className="text-xl font-display font-bold flex items-center gap-2">
                <span className={report.summary.budget_alerts > 0 ? "text-warning" : "text-success"}>{report.summary.budget_alerts}</span>
                <span className="text-muted-foreground">/</span>
                <span className={report.summary.stale_count > 0 ? "text-warning" : "text-success"}>{report.summary.stale_count}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">alerts / stale</div>
            </div>
          </div>

          {/* Alerts Section */}
          {(report.budget_alerts && report.budget_alerts.length > 0) && (
            <DashboardCard title="BUDGET ALERTS" intent="warning" className="mb-6">
              <div className="space-y-2">
                {report.budget_alerts.map((alert: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 bg-warning/5 rounded-lg p-3">
                    <AlertTriangle className="size-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium">{alert.name}</div>
                      <div className="text-[10px] text-muted-foreground">{alert.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Stale Epics */}
          {(report.stale_epics && report.stale_epics.length > 0) && (
            <DashboardCard title="STALE EPICS" intent="warning" className="mb-6">
              <div className="space-y-2">
                {report.stale_epics.map((epic: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-accent/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-warning" />
                      <span className="text-xs">{epic.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {epic.days_idle}d idle · {epic.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Daemon Log */}
          <DashboardCard title="DAEMON LOG" className="mb-6">
            <div className="bg-black/80 rounded-lg p-4 max-h-[200px] overflow-y-auto">
              {logTail.length > 0 ? (
                <pre className="text-[10px] font-mono text-green-400/80 whitespace-pre-wrap leading-relaxed">
                  {logTail.join("\n")}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No log entries</p>
              )}
            </div>
          </DashboardCard>
        </>
      )}
    </DashboardPageLayout>
  );
}
