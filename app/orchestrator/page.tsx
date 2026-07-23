"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Circle, AlertTriangle, ArrowUp, ArrowDown,
  Database, Zap, Cpu, Activity, Clock, GitBranch, Hash,
  BrainCircuit, Network, Layers, FileText,
  Play, Pause, XCircle, Trash2, Plus, Send, User,
} from "lucide-react";
import LayoutLeftIcon from "@/components/icons/layout";
import { getHealth, getSystemInfo } from "@/lib/api-client";

/* ────────────── Types ────────────── */

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "done" | "failed";
  priority: number;
  assigned_to: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  notes: { text: string; at: string }[];
}

/* ────────────── Helpers ────────────── */

const statusIcon: Record<string, React.ElementType> = {
  pending: Circle,
  running: Play,
  done: CheckCircle2,
  completed: CheckCircle2,
  failed: XCircle,
};

const statusColor: Record<string, string> = {
  pending: "text-muted-foreground",
  running: "text-primary",
  done: "text-success",
  completed: "text-success",
  failed: "text-destructive",
};

const statusBg: Record<string, string> = {
  pending: "bg-muted/30 border-border/40",
  running: "bg-primary/5 border-primary/20",
  done: "bg-success/5 border-success/20",
  completed: "bg-success/5 border-success/20",
  failed: "bg-destructive/5 border-destructive/20",
};

const priorityColor: Record<number, string> = {
  1: "bg-gray-500/20 text-gray-400",
  2: "bg-blue-500/20 text-blue-400",
  3: "bg-amber-500/20 text-amber-400",
  4: "bg-orange-500/20 text-orange-400",
  5: "bg-red-500/20 text-red-400",
};

/* ────────────── Task Card ────────────── */

function TaskCard({ task, onUpdate }: { task: Task; onUpdate: (id: string, status: string) => void }) {
  const Icon = statusIcon[task.status] || Circle;
  const ago = task.created_at
    ? Math.floor((Date.now() - new Date(task.created_at).getTime()) / 60000)
    : 0;
  const timeStr = ago < 1 ? "just now" : ago < 60 ? `${ago}m ago` : `${Math.floor(ago / 60)}h ago`;

  return (
    <div className={cn("rounded-lg border p-3 transition-all hover:border-primary/30", statusBg[task.status])}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className={cn("size-4 mt-0.5 shrink-0", statusColor[task.status])} />
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{task.title}</div>
            {task.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[8px] shrink-0", priorityColor[task.priority] || "bg-muted")}>
          P{task.priority}
        </Badge>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {task.assigned_to && (
            <span className="flex items-center gap-1">
              <User className="size-3" />{task.assigned_to}
            </span>
          )}
          <Clock className="size-3" />{timeStr}
        </div>
        <div className="flex items-center gap-1">
          {task.status === "pending" && (
            <button onClick={() => onUpdate(task.id, "running")} className="size-5 rounded hover:bg-accent flex items-center justify-center text-success" title="Start">
              <Play className="size-3" />
            </button>
          )}
          {task.status === "running" && (
            <>
              <button onClick={() => onUpdate(task.id, "done")} className="size-5 rounded hover:bg-accent flex items-center justify-center text-success" title="Complete">
                <CheckCircle2 className="size-3" />
              </button>
              <button onClick={() => onUpdate(task.id, "failed")} className="size-5 rounded hover:bg-accent flex items-center justify-center text-destructive" title="Fail">
                <XCircle className="size-3" />
              </button>
            </>
          )}
          {(task.status === "done" || task.status === "failed") && (
            <button onClick={() => onUpdate(task.id, "pending")} className="size-5 rounded hover:bg-accent flex items-center justify-center text-muted-foreground" title="Reopen">
              <UndoIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UndoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
      <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

/* ────────────── Create Task Form ────────────── */

function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agent, setAgent] = useState("");
  const [priority, setPriority] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          agent: agent.trim() || null,
          priority,
        }),
      });
      setTitle(""); setDescription(""); setAgent("");
      onCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 space-y-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="h-9 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>
      <div className="w-32 space-y-1">
        <Input
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          placeholder="Agent"
          className="h-9 text-xs"
        />
      </div>
      <div className="w-20 space-y-1">
        <select
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-xs"
        >
          {[1,2,3,4,5].map(p => (
            <option key={p} value={p}>P{p}</option>
          ))}
        </select>
      </div>
      <Button onClick={handleSubmit} disabled={submitting || !title.trim()} className="h-9 text-xs gap-1">
        <Plus className="size-3.5" /> ADD
      </Button>
    </div>
  );
}

/* ────────────── Main Page ────────────── */

export default function OrchestratorPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTasks();
    const iv = setInterval(fetchTasks, 5000);
    return () => clearInterval(iv);
  }, [fetchTasks]);

  const updateTask = async (id: string, status: string) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const runningTasks = tasks.filter(t => t.status === "running");
  const doneTasks = tasks.filter(t => t.status === "done" || t.status === "completed");
  const failedTasks = tasks.filter(t => t.status === "failed");

  return (
    <DashboardPageLayout
      header={{
        title: "Orchestrator",
        description: "Task Dispatch · Agent Workload · Queue Management",
        icon: LayoutLeftIcon,
      }}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <DashboardStat label="PENDING" value={String(pendingTasks.length)} description="IN QUEUE" icon={Circle} intent={pendingTasks.length > 0 ? "warning" : "positive"} direction={pendingTasks.length > 0 ? "up" : "down"} />
        <DashboardStat label="RUNNING" value={String(runningTasks.length)} description="ACTIVE" icon={Play} intent={runningTasks.length > 0 ? "positive" : "negative"} direction={runningTasks.length > 0 ? "up" : "down"} />
        <DashboardStat label="COMPLETED" value={String(doneTasks.length)} description="DONE" icon={CheckCircle2} intent="positive" direction="up" />
        <DashboardStat label="FAILED" value={String(failedTasks.length)} description="ERRORS" icon={XCircle} intent={failedTasks.length > 0 ? "negative" : "positive"} direction={failedTasks.length > 0 ? "up" : "down"} />
        <DashboardStat label="TOTAL" value={String(tasks.length)} description="ALL TIME" icon={Database} intent="positive" direction="up" />
      </div>

      {/* Create Task */}
      <DashboardCard title="QUICK DISPATCH" className="mb-6">
        <CreateTaskForm onCreated={fetchTasks} />
      </DashboardCard>

      {/* Kanban-style Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Pending */}
        <DashboardCard
          title="PENDING"
          intent={pendingTasks.length > 0 ? "warning" : "default"}
          addon={<Badge variant={pendingTasks.length > 0 ? "default" : "secondary"} className="text-[9px]">{pendingTasks.length}</Badge>}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No pending tasks</p>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="group relative">
                  <TaskCard task={task} onUpdate={updateTask} />
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="absolute top-1 right-1 size-4 rounded hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="size-2.5 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        {/* Running */}
        <DashboardCard
          title="RUNNING"
          intent={runningTasks.length > 0 ? "success" : "default"}
          addon={<Badge variant={runningTasks.length > 0 ? "default" : "secondary"} className="text-[9px]">{runningTasks.length}</Badge>}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {runningTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No running tasks</p>
            ) : (
              runningTasks.map(task => <TaskCard key={task.id} task={task} onUpdate={updateTask} />)
            )}
          </div>
        </DashboardCard>

        {/* Completed */}
        <DashboardCard
          title="COMPLETED"
          addon={<Badge variant="secondary" className="text-[9px]">{doneTasks.length + failedTasks.length}</Badge>}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {doneTasks.length === 0 && failedTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No completed tasks</p>
            ) : (
              <>
                {doneTasks.map(task => <TaskCard key={task.id} task={task} onUpdate={updateTask} />)}
                {failedTasks.map(task => (
                  <div key={task.id} className="group relative">
                    <TaskCard task={task} onUpdate={updateTask} />
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="absolute top-1 right-1 size-4 rounded hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="size-2.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </DashboardCard>
      </div>
    </DashboardPageLayout>
  );
}
