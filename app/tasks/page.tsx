"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getHealth } from "@/lib/api-client";
import { ArrowUp, ArrowDown, Clock, CheckCircle2, XCircle, Play, RotateCw, Filter } from "lucide-react";

/* ────────────── Types ────────────── */

type TaskStatus = "pending" | "running" | "completed" | "failed" | "blocked";
type TaskPriority = "high" | "medium" | "low";

interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  agent: string;
  created: string;
  duration?: string;
  retries?: number;
}

/* ────────────── Sample Tasks ────────────── */

const defaultTasks: Task[] = [
  { id: "t1",  name: "Deploy dashboard 7070",          description: "Serve ZES Orchestration Dashboard on port 7070", status: "completed", priority: "high",   agent: "Codex",   created: "2h ago",  duration: "3m 12s", retries: 1 },
  { id: "t2",  name: "Wire Overview page to Flask API", description: "Replace mock.json with live :5002 endpoints",   status: "completed", priority: "high",   agent: "Hermes",  created: "1h ago",  duration: "45s",    retries: 0 },
  { id: "t3",  name: "Create Orchestrator page",        description: "Strategic command center page for goal tracking", status: "running", priority: "high", agent: "Hermes",  created: "10m ago", duration: "—",      retries: 0 },
  { id: "t4",  name: "Build Tasks queue page",          description: "Task list with priority and status management",  status: "pending",  priority: "medium", agent: "Hermes",  created: "5m ago",  duration: "—",      retries: 0 },
  { id: "t5",  name: "Fix papirus icon imports",        description: "Module not found for ChatIcon in papirus barrel",status: "completed", priority: "high",   agent: "Hermes",  created: "30m ago", duration: "2m 18s", retries: 2 },
  { id: "t6",  name: "Install react-is dependency",     description: "Missing recharts peer dependency",              status: "completed", priority: "medium", agent: "Codex",   created: "1h ago",  duration: "22s",    retries: 0 },
  { id: "t7",  name: "Set up memory hub sync daemon",   description: "Continuous memory sync between Hermes and Codex",status: "running", priority: "high",   agent: "Codex",   created: "15m ago", duration: "—",      retries: 0 },
  { id: "t8",  name: "Create Skills page",              description: "Browser for installed ZES agent skills",          status: "pending",  priority: "low",    agent: "Hermes",  created: "2m ago",  duration: "—",      retries: 0 },
  { id: "t9",  name: "OpenRouter integration",          description: "Connect to GPT-4/o1 for strategic advice",       status: "blocked",  priority: "low",    agent: "—",       created: "1d ago",  duration: "—",      retries: 3 },
  { id: "t10", name: "Cloud backup setup",              description: "Encrypted off-device snapshot pipeline",         status: "pending",  priority: "low",    agent: "—",       created: "2d ago",  duration: "—",      retries: 0 },
];

/* ────────────── Status Config ────────────── */

const statusStyles: Record<TaskStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:   { label: "PENDING",   className: "bg-muted text-muted-foreground border-muted-foreground/20",         icon: Clock },
  running:   { label: "RUNNING",   className: "bg-info/15 text-info border-info/30",                              icon: RotateCw },
  completed: { label: "DONE",      className: "bg-success/15 text-success border-success/30",                     icon: CheckCircle2 },
  failed:    { label: "FAILED",    className: "bg-destructive/15 text-destructive border-destructive/30",          icon: XCircle },
  blocked:   { label: "BLOCKED",  className: "bg-destructive/10 text-destructive border-destructive/20",          icon: XCircle },
};

const priorityStyles: Record<TaskPriority, { className: string; icon: React.ElementType }> = {
  high:   { className: "text-destructive",   icon: ArrowUp },
  medium: { className: "text-warning",        icon: ArrowDown },
  low:    { className: "text-muted-foreground", icon: ArrowDown },
};

/* ────────────── Main ────────────── */

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [liveSvc, setLiveSvc] = useState(0);
  const [lastSync, setLastSync] = useState<string>("");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks && data.tasks.length > 0) {
        // Map kanban tasks to our format
        const mapped: Task[] = data.tasks.map((t: any) => ({
          id: t.id || `t_${Math.random().toString(36).slice(2, 6)}`,
          name: t.title || t.name || "Untitled",
          description: t.body || t.description || "",
          status: (t.status === "done" ? "completed" : t.status) as TaskStatus || "pending",
          priority: t.priority >= 3 ? "high" : t.priority >= 1 ? "medium" : "low",
          agent: t.created_by || "—",
          created: t.created_at
            ? `${Math.floor((Date.now() / 1000 - t.created_at) / 60)}m ago`
            : "—",
          duration: t.completed_at ? "auto" : undefined,
          retries: t.retries || 0,
        }));
        setTasks(mapped);
      }
    } catch {
      // Fallback to empty
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([
      fetchTasks(),
      getHealth().then((h) => {
        if (h) setLiveSvc(h.filter((s) => (s as any).alive).length);
      }),
    ]);
    setLastSync(new Date().toLocaleTimeString());
  }, [fetchTasks]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    running: tasks.filter((t) => t.status === "running").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed" || t.status === "blocked").length,
  };

  const simulateRetry = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "running" as TaskStatus, retries: (t.retries || 0) + 1, created: "just now" }
          : t
      )
    );
    try {
      await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "running" }),
      });
    } catch {}
    // Auto-complete after 3s
    setTimeout(async () => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id && t.status === "running"
            ? { ...t, status: "completed" as TaskStatus, duration: "~3s" }
            : t
        )
      );
    }, 3000);
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardPageLayout
        header={{
          title: "Tasks",
          description: "Kanban workflow · task tracking · agent assignments",
          icon: CheckCircle2,
        }}
      >
        <div className="text-center py-20">
          <RotateCw className="size-8 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Syncing kanban tasks...</p>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Tasks",
        description: `Queue · ${liveSvc} agents online · ${counts.running} running · sync ${lastSync || "..."}`,
        icon: CheckCircle2,
      }}
    >
      {/* ── Filter pills ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "pending", "running", "completed", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-accent/30 text-muted-foreground hover:bg-accent/60"
            )}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* ── Task List ── */}
      <div className="space-y-2">
        {filtered.map((task) => {
          const st = statusStyles[task.status] || statusStyles.pending;
          const pri = priorityStyles[task.priority] || priorityStyles.low;
          const PriIcon = pri.icon;
          const StIcon = st.icon;

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-4 rounded-lg border p-4 transition-all",
                task.status === "running" ? "border-info/30 bg-info/5" : "border-border/40 bg-card"
              )}
            >
              {/* Priority icon */}
              <div className={cn("mt-1", pri.className)}>
                <PriIcon className="size-4" />
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm">{task.name}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border", st.className)}>
                    <StIcon className="size-2.5" />
                    {st.label}
                  </span>
                  <Badge variant="outline" className="text-[9px] uppercase ml-auto">
                    {task.agent}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{task.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground font-mono">
                  <span>{task.created}</span>
                  {task.duration && task.duration !== "—" && (
                    <>
                      <span>·</span>
                      <span>{task.duration}</span>
                    </>
                  )}
                  {task.retries !== undefined && task.retries > 0 && (
                    <>
                      <span>·</span>
                      <span>{task.retries} retr{task.retries > 1 ? "ies" : "y"}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {task.status === "failed" || task.status === "blocked" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => simulateRetry(task.id)}
                  >
                    <RotateCw className="size-3 mr-1" />
                    RETRY
                  </Button>
                ) : task.status === "pending" ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => simulateRetry(task.id)}
                  >
                    <Play className="size-3 mr-1" />
                    START
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No tasks match this filter</p>
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
}
