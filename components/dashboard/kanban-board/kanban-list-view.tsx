"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown, Filter, Search, ExternalLink, Trash2, GripVertical,
} from "lucide-react";

interface KanbanTask {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: number;
  created_by: string;
  created_at: number;
  assignee?: string;
}

const COLUMNS = [
  { id: "triage",   label: "Triage",   color: "text-muted-foreground" },
  { id: "todo",     label: "To Do",    color: "text-muted-foreground" },
  { id: "scheduled",label: "Scheduled",color: "text-info" },
  { id: "ready",    label: "Ready",    color: "text-info" },
  { id: "running",  label: "Running",  color: "text-warning" },
  { id: "blocked",  label: "Blocked",  color: "text-destructive" },
  { id: "review",   label: "Review",   color: "text-warning" },
  { id: "done",     label: "Done",     color: "text-success" },
];

export function KanbanListView() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "created_at" | "status">("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5002/api/kanban/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const iv = setInterval(fetchTasks, 10000);
    return () => clearInterval(iv);
  }, []);

  const q = search.toLowerCase();
  const filtered = tasks
    .filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.body?.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      const valA = sortBy === "priority" ? a.priority : a.created_at;
      const valB = sortBy === "priority" ? b.priority : b.created_at;
      return sortDir === "desc" ? valB - valA : valA - valB;
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const getStatusInfo = (status: string) => {
    const col = COLUMNS.find((c) => c.id === status);
    return col || { label: status, color: "text-muted-foreground" };
  };

  const getPriorityLabel = (p: number) => {
    if (p >= 3) return { label: "HIGH", className: "text-destructive border-destructive/30" };
    if (p >= 1) return { label: "MED", className: "text-warning border-warning/30" };
    return { label: "LOW", className: "text-muted-foreground border-border/30" };
  };

  const getAge = (ts: number) => {
    const hours = Math.floor((Date.now() / 1000 - ts) / 3600);
    if (hours < 1) return "<1h";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const columnCounts = COLUMNS.map((col) => ({
    ...col,
    count: tasks.filter((t) => t.status === col.id).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Column filters */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all",
            statusFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-accent/20 text-muted-foreground hover:bg-accent/40"
          )}
        >
          All ({tasks.length})
        </button>
        {columnCounts.map((col) => (
          <button
            key={col.id}
            onClick={() => setStatusFilter(col.id)}
            className={cn(
              "px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all",
              statusFilter === col.id
                ? "bg-primary text-primary-foreground"
                : "bg-accent/20 text-muted-foreground hover:bg-accent/40"
            )}
          >
            {col.label} ({col.count})
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-border bg-accent/20 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={() => toggleSort("priority")}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all",
            sortBy === "priority" ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:bg-accent/20"
          )}
        >
          <ArrowUpDown className="size-3" />
          Priority
        </button>
        <button
          onClick={() => toggleSort("created_at")}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all",
            sortBy === "created_at" ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:bg-accent/20"
          )}
        >
          <ArrowUpDown className="size-3" />
          Age
        </button>
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-border/30">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">No tasks match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map((task) => {
              const status = getStatusInfo(task.status);
              const pri = getPriorityLabel(task.priority);
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-accent/10 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{task.title}</span>
                      {task.body && (
                        <span className="text-[10px] text-muted-foreground line-clamp-1 flex-1">
                          — {task.body}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border", pri.className)}>
                        {pri.label}
                      </span>
                      <span className={cn("text-[9px] font-semibold uppercase", status.color)}>
                        {status.label}
                      </span>
                      {task.assignee && (
                        <Badge variant="outline" className="text-[8px]">{task.assignee}</Badge>
                      )}
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {getAge(task.created_at)}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">{task.created_by}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
