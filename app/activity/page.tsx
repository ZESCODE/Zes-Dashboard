"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Zap, Clock, Bot, Terminal, GitBranch,
  MessageSquare, AlertCircle, CheckCircle2, RefreshCw,
  Filter, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────── Types ────────────── */

interface ActivityEvent {
  id: string;
  source: string;
  type: string;
  agent: string;
  payload: Record<string, string>;
  timestamp: string;
}

interface ActivityStats {
  total: number;
  last_24h: number;
  sources: Record<string, number>;
  types: Record<string, number>;
}

/* ────────────── Helpers ────────────── */

const SOURCE_ICONS: Record<string, any> = {
  dashboard: Activity,
  codex: Terminal,
  hermes: Bot,
  claude: MessageSquare,
  system: Zap,
  webhook: GitBranch,
};

const SOURCE_COLORS: Record<string, string> = {
  dashboard: "bg-blue-500/20 text-blue-400",
  codex: "bg-emerald-500/20 text-emerald-400",
  hermes: "bg-purple-500/20 text-purple-400",
  claude: "bg-amber-500/20 text-amber-400",
  system: "bg-rose-500/20 text-rose-400",
  webhook: "bg-cyan-500/20 text-cyan-400",
};

function timeAgo(ts: string): string {
  const sec = (Date.now() - new Date(ts).getTime()) / 1000;
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

/* ────────────── Main Page ────────────── */

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState("");
  const [showPayload, setShowPayload] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, statRes] = await Promise.all([
        fetch(`/api/activity?path=list&limit=50&source=${filterSource}`),
        fetch("/api/activity?path=stats"),
      ]);
      if (evRes.ok) setEvents(await evRes.json());
      if (statRes.ok) setStats(await statRes.json());
    } catch {}
    setLoading(false);
  }, [filterSource]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <DashboardPageLayout
      header={{
        title: "Activity",
        description: "Real-time agent event bus · cross-agent activity log",
        icon: Activity,
      }}
    >
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Activity} label="Total Events" value={String(stats.total)} color="text-blue-400" />
          <StatCard icon={Clock} label="Last 24h" value={String(stats.last_24h)} color="text-emerald-400" />
          <StatCard icon={Bot} label="Sources" value={String(Object.keys(stats.sources).length)} color="text-purple-400" />
          <StatCard icon={Zap} label="Types" value={String(Object.keys(stats.types).length)} color="text-amber-400" />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Filter className="size-3" /> Source:
        </span>
        <Button
          variant={!filterSource ? "default" : "outline"} size="sm" className="text-xs h-7"
          onClick={() => setFilterSource("")}
        >All</Button>
        {stats && Object.keys(stats.sources).map(s => (
          <Button
            key={s}
            variant={filterSource === s ? "default" : "outline"} size="sm" className="text-xs h-7 capitalize"
            onClick={() => setFilterSource(s)}
          >
            {s}
          </Button>
        ))}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
        <Button
          variant="outline" size="sm" className="text-xs"
          onClick={async () => {
            await fetch("/api/activity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: "dashboard",
                type: "test",
                payload: { message: "Manual test event from dashboard" },
                agent: "hermes",
              }),
            });
            fetchData();
          }}
        >
          <Play className="size-3 mr-1" /> Test Event
        </Button>
      </div>

      {/* Event List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="size-6 mx-auto mb-2 animate-spin opacity-50" />
          Loading activity...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="size-8 mx-auto mb-2 opacity-50" />
          <p>No events{filtersource ? ` from "${filterSource}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map(e => {
            const Icon = SOURCE_ICONS[e.source] || Activity;
            return (
              <div
                key={e.id}
                className="flex items-start gap-3 bg-accent/5 rounded-lg p-3 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => setShowPayload(showPayload === e.id ? null : e.id)}
              >
                <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", SOURCE_COLORS[e.source] || "bg-gray-500/20 text-gray-400")}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold capitalize">{e.source}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{e.type}</Badge>
                    {e.agent && (
                      <Badge variant="secondary" className="text-[9px]">
                        <Bot className="size-2.5 mr-1" />{e.agent}
                      </Badge>
                    )}
                    <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                      {timeAgo(e.timestamp)}
                    </span>
                  </div>
                  {Object.keys(e.payload).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {Object.entries(e.payload).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="text-[10px] font-mono opacity-60">{k}=</span>
                          <span>{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {showPayload === e.id && (
                    <pre className="mt-2 text-[10px] font-mono bg-accent/20 rounded p-2 overflow-x-auto">
                      {JSON.stringify(e, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Source breakdown */}
      {stats && Object.keys(stats.sources).length > 0 && (
        <DashboardCard title="Source Breakdown" className="mt-4">
          <div className="space-y-2">
            {Object.entries(stats.sources)
              .sort(([, a], [, b]) => b - a)
              .map(([src, count]) => (
                <div key={src} className="flex items-center gap-2">
                  <span className="text-xs font-semibold w-24 capitalize">{src}</span>
                  <div className="flex-1 h-4 bg-accent/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / stats.total) * 100}%`,
                        background: src === "hermes" ? "oklch(0.6 0.2 280)" :
                                     src === "codex" ? "oklch(0.6 0.15 160)" :
                                     src === "claude" ? "oklch(0.6 0.15 40)" :
                                     src === "dashboard" ? "oklch(0.6 0.15 200)" :
                                     "oklch(0.5 0.1 0)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{count}</span>
                </div>
              ))}
          </div>
        </DashboardCard>
      )}
    </DashboardPageLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color: string;
}) {
  return (
    <div className="bg-accent/20 rounded-lg p-3 flex items-center gap-2">
      <Icon className={cn("size-5 shrink-0", color)} />
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-sm font-mono font-bold">{value}</div>
      </div>
    </div>
  );
}
