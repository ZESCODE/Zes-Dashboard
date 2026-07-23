"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Columns3, List, Play, CheckCircle2, Circle, XCircle } from "lucide-react";

/* ────────────── Types ────────────── */
import { KanbanListView } from "@/components/dashboard/kanban-board/kanban-list-view";
import Link from "next/link";

const statusIcon: Record<string, React.ElementType> = {
  pending: Circle, running: Play, done: CheckCircle2, completed: CheckCircle2, failed: XCircle,
};
const statusColor: Record<string, string> = {
  pending: "text-muted-foreground", running: "text-primary", done: "text-success", completed: "text-success", failed: "text-destructive",
};

export default function KanbanPage() {
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [localTasks, setLocalTasks] = useState<any[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setLocalTasks(data.tasks || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
    const iv = setInterval(fetchTasks, 10000);
    return () => clearInterval(iv);
  }, [fetchTasks]);

  const pendingTasks = localTasks.filter(t => t.status === "pending");
  const runningTasks = localTasks.filter(t => t.status === "running");
  const doneTasks = localTasks.filter(t => t.status === "done" || t.status === "completed");
  const failedTasks = localTasks.filter(t => t.status === "failed");

  return (
    <DashboardPageLayout
      header={{
        title: "Kanban",
        description: `Agent tasks · ${localTasks.length} total tasks`,
        icon: Columns3,
        actions: (
          <Link href="/orchestrator">
            <Button variant="outline" size="sm" className="h-7 text-[10px]">
              DISPATCH &rarr;
            </Button>
          </Link>
        ),
      }}
    >
      {/* Local Task Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-accent/15 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Circle className="size-3" /> Pending
          </div>
          <div className="text-xl font-display font-bold">{pendingTasks.length}</div>
        </div>
        <div className="bg-accent/15 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Play className="size-3 text-primary" /> Running
          </div>
          <div className="text-xl font-display font-bold">{runningTasks.length}</div>
        </div>
        <div className="bg-accent/15 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
            <CheckCircle2 className="size-3 text-success" /> Done
          </div>
          <div className="text-xl font-display font-bold">{doneTasks.length}</div>
        </div>
        <div className="bg-accent/15 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
            <XCircle className="size-3 text-destructive" /> Failed
          </div>
          <div className="text-xl font-display font-bold">{failedTasks.length}</div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          {viewMode === "board"
            ? "Drag tasks between columns to update status. Connected to task dispatch API."
            : "List view of all tasks."}
        </p>
        <div className="flex bg-accent/30 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("board")}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5",
              viewMode === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            <Columns3 className="size-3.5" />
            Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            <List className="size-3.5" />
            List
          </button>
        </div>
      </div>

      {viewMode === "board" ? <KanbanBoard /> : <KanbanListView />}
    </DashboardPageLayout>
  );
}
