"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GitBranch, GitPullRequest, Bug, Activity, RefreshCw, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const eventIcon: Record<string, React.ElementType> = {
  push: GitBranch,
  pull_request: GitPullRequest,
  issues: Bug,
  workflow_run: Activity,
};

const eventColor: Record<string, string> = {
  push: "text-blue-400",
  pull_request: "text-green-400",
  issues: "text-amber-400",
  workflow_run: "text-purple-400",
};

export default function WebhooksPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks`);
  }, []);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setStats(data.stats || null);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchWebhooks();
    const iv = setInterval(fetchWebhooks, 15000);
    return () => clearInterval(iv);
  }, [fetchWebhooks]);

  const copyUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Webhooks",
        description: `${stats?.total || 0} events · ${stats?.last_24h || 0} last 24h`,
        icon: GitBranch,
      }}
    >
      {/* Webhook URL + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <DashboardCard title="WEBHOOK ENDPOINT" className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-accent/20 rounded px-3 py-2 truncate font-mono">
              {webhookUrl || "Loading..."}
            </code>
            <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={copyUrl}>
              {copied ? <CheckCircle2 className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
            <p>Configure your GitHub repo to send webhooks to this URL.</p>
            <p>Supported events: <Badge variant="outline" className="text-[8px]">push</Badge> <Badge variant="outline" className="text-[8px]">pull_request</Badge> <Badge variant="outline" className="text-[8px]">issues</Badge> <Badge variant="outline" className="text-[8px]">workflow_run</Badge></p>
            <p>Payload format: <code className="text-[9px]">Content-Type: application/json</code></p>
          </div>
        </DashboardCard>

        <DashboardCard title="STATISTICS">
          {stats ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-bold">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last 24h</span>
                <span className="font-bold">{stats.last_24h}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-bold">{stats.pending}</span>
              </div>
              {stats.sources && Object.keys(stats.sources).length > 0 && (
                <div className="pt-2 border-t border-border/30">
                  <div className="text-[10px] text-muted-foreground mb-1">Sources</div>
                  {Object.entries(stats.sources).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[10px]">
                      <span>{k}</span>
                      <span className="font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No data</p>
          )}
        </DashboardCard>
      </div>

      {/* Event Log */}
      <DashboardCard
        title="EVENT LOG"
        addon={
          <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={fetchWebhooks}>
            <RefreshCw className="size-3 mr-1" /> REFRESH
          </Button>
        }
      >
        {loading ? (
          <div className="space-y-2 p-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-14 rounded-md bg-accent/5 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No webhook events yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Push to a GitHub repo or use the test button below
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {events.map((evt: any, i: number) => {
              const Icon = eventIcon[evt.type] || Activity;
              return (
                <div
                  key={evt.id || i}
                  className="flex items-start gap-3 p-2.5 rounded-md hover:bg-accent/20 transition-colors"
                >
                  <Icon className={cn("size-4 mt-0.5 shrink-0", eventColor[evt.type] || "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[8px] uppercase tracking-wider">{evt.type}</Badge>
                      {evt.source && (
                        <span className="text-[9px] text-muted-foreground">{evt.source}</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate">{evt.id}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{evt.timestamp}</span>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>

      {/* Quick Test */}
      <div className="mt-6">
        <DashboardCard title="TEST WEBHOOK">
          <p className="text-xs text-muted-foreground mb-3">
            Send a test push event to verify your webhook endpoint is working.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch("/api/webhooks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-github-event": "push" },
                  body: JSON.stringify({
                    ref: "refs/heads/main",
                    repository: { full_name: "zes/test-webhook" },
                    head_commit: { author: { name: "ZES Bot" }, message: "Test webhook event" },
                    commits: [{ message: "Test webhook event" }],
                  }),
                });
                if (res.ok) {
                  fetchWebhooks();
                }
              } catch {}
            }}
          >
            <GitBranch className="size-3.5 mr-1.5" /> Send Test Push
          </Button>
        </DashboardCard>
      </div>
    </DashboardPageLayout>
  );
}
