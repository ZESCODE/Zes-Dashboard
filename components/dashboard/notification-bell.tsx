"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bell, BellRing, MessageSquare, XCircle, Calendar, Clock,
  AlertTriangle, CheckCircle2, ArrowRight, GitBranch,
} from "lucide-react";

interface Notification {
  id: string;
  type: "review" | "failed" | "scheduled" | "feedback";
  title: string;
  description: string;
  link: string;
  severity: "warning" | "error" | "info" | "success";
  timestamp: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const items: Notification[] = [];

      // 1. Pipeline items in "review" stage (pending CEO review)
      try {
        const companiesRes = await fetch("/api/company?path=list");
        const companies = await companiesRes.json();
        const companyList = Array.isArray(companies) ? companies : [];

        for (const c of companyList.slice(0, 10)) {
          const cid = typeof c === "string" ? c : c.id;
          if (!cid) continue;
          const pipeRes = await fetch(`/api/company/pipeline?company=${cid}&path=get`);
          if (!pipeRes.ok) continue;
          const pipe = await pipeRes.json();
          if (pipe.items) {
            const reviews = pipe.items.filter((i: any) => i.stage === "review");
            for (const item of reviews) {
              items.push({
                id: `review-${cid}-${item.id}`,
                type: "review",
                title: `Review needed: ${item.title}`,
                description: `In ${cid} pipeline · ${item.feedback_count || 0} previous feedback`,
                link: `/company/${cid}/pipeline`,
                severity: "warning",
                timestamp: item.updated_at,
              });
            }
          }
        }
      } catch {}

      // 2. Failed tasks
      try {
        const tasksRes = await fetch("/api/tasks");
        const tasksData = await tasksRes.json();
        const taskList = tasksData.tasks || [];
        for (const t of taskList.slice(0, 10)) {
          if (t.status === "failed" || t.status === "error") {
            items.push({
              id: `failed-${t.id}`,
              type: "failed",
              title: `Task failed: ${t.title || t.name || "Untitled"}`,
              description: `Priority ${t.priority || "?"} · ${t.assigned_to || t.created_by || "unknown"}`,
              link: "/orchestrator",
              severity: "error",
              timestamp: t.updated_at || t.created_at,
            });
          }
        }
      } catch {}

      // 3. Upcoming scheduled tasks (within next hour)
      try {
        const schedRes = await fetch("/api/scheduler?path=list");
        const schedList = await schedRes.json();
        const schedules = Array.isArray(schedList) ? schedList : [];
        const now = Date.now();
        for (const s of schedules) {
          if (!s.next_run || !s.enabled) continue;
          const nextRun = new Date(s.next_run).getTime();
          const diff = nextRun - now;
          if (diff > 0 && diff < 3600000) { // within 1 hour
            items.push({
              id: `sched-${s.id}`,
              type: "scheduled",
              title: `Scheduled: ${s.name}`,
              description: s.schedule || `${Math.ceil(diff / 60000)}m away`,
              link: "/scheduler",
              severity: "info",
              timestamp: s.next_run,
            });
          }
        }
      } catch {}

      // Sort by severity then recency
      const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2, success: 3 };
      items.sort((a, b) => {
        const sa = severityOrder[a.severity] ?? 99;
        const sb = severityOrder[b.severity] ?? 99;
        if (sa !== sb) return sa - sb;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setNotifications(items.slice(0, 20));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    const escHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  const errorCount = notifications.filter(n => n.severity === "error").length;
  const warningCount = notifications.filter(n => n.severity === "warning").length;
  const total = notifications.length;

  const severityIcon: Record<string, React.ElementType> = {
    review: MessageSquare,
    failed: XCircle,
    scheduled: Calendar,
    feedback: MessageSquare,
  };

  const severityColors: Record<string, string> = {
    error: "text-red-400 bg-red-500/10 border-red-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative size-8 rounded-full flex items-center justify-center hover:bg-accent/30 transition-colors"
        title="Notifications"
      >
        {total > 0 ? <BellRing className="size-4 text-primary" /> : <Bell className="size-4 text-muted-foreground" />}
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-destructive text-[7px] font-bold flex items-center justify-center text-destructive-foreground">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-xs font-semibold">
              Notifications
              {total > 0 && <span className="text-muted-foreground font-normal ml-1">({total})</span>}
            </span>
            <button
              onClick={() => { fetchNotifications(); }}
              className="text-[9px] text-muted-foreground hover:text-foreground"
            >
              Refresh
            </button>
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">Checking...</div>
            ) : total === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <CheckCircle2 className="size-6 mx-auto mb-2 text-emerald-400/50" />
                All clear — no pending items
              </div>
            ) : (
              notifications.map(n => {
                const Icon = severityIcon[n.type] || AlertTriangle;
                return (
                  <button
                    key={n.id}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent/20 transition-colors border-b border-border/10 last:border-0"
                    onClick={() => { router.push(n.link); setOpen(false); }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn("size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", severityColors[n.severity])}>
                        <Icon className="size-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium leading-tight">{n.title}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{n.description}</div>
                      </div>
                      <ArrowRight className="size-3 text-muted-foreground/30 shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {total > 0 && (
            <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border/20 text-[9px] text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-red-400" /> {errorCount} failed
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-amber-400" /> {warningCount} reviews
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-blue-400" /> {total - errorCount - warningCount} other
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
