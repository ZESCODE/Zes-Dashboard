"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Clock, Play, Plus, Trash2, RefreshCw,
  Bot, Terminal, CheckCircle2, XCircle, AlertCircle,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────── Types ────────────── */

interface Schedule {
  id: number;
  name: string;
  cron: string;
  task_template: string;
  agent: string;
  enabled: boolean;
  description: string;
  created_at: string;
  last_run: string | null;
  last_status: string | null;
  run_count: number;
}

interface ScheduleStats {
  total: number;
  enabled: number;
  total_runs: number;
  agents: Record<string, number>;
}

/* ────────────── Main Page ────────────── */

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cron: "0 6 * * *",
    task_template: "",
    agent: "codex",
    description: "",
  });
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, statRes] = await Promise.all([
        fetch("/api/scheduler?path=list"),
        fetch("/api/scheduler?path=stats"),
      ]);
      if (schedRes.ok) setSchedules(await schedRes.json());
      if (statRes.ok) setStats(await statRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    setFormError("");
    if (!formData.name.trim() || !formData.task_template.trim()) {
      setFormError("Name and task template are required");
      return;
    }
    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setFormError(data.error);
      } else {
        setShowForm(false);
        setFormData({ name: "", cron: "0 6 * * *", task_template: "", agent: "codex", description: "" });
        fetchData();
      }
    } catch {}
  };

  const handleToggle = async (s: Schedule) => {
    await fetch("/api/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: s.id, enabled: !s.enabled }),
    });
    fetchData();
  };

  const handleRun = async (s: Schedule) => {
    await fetch("/api/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run", id: s.id }),
    });
    setTimeout(fetchData, 1000);
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    fetchData();
  };

  // Common templates
  const templates = [
    { label: "Daily Review",     cron: "0 6 * * *",  template: "Run health check and report", agent: "hermes" },
    { label: "Memory Sync",      cron: "0 */6 * * *", template: "Sync memory hub and write review", agent: "hermes" },
    { label: "Weekly Cleanup",   cron: "0 8 * * 0",  template: "Clean up old logs and prune archives", agent: "codex" },
    { label: "Budget Check",     cron: "0 9 * * *",  template: "Check token budget and report usage", agent: "hermes" },
    { label: "Security Audit",   cron: "0 7 * * 1",  template: "Run security audit on all services", agent: "codex" },
  ];

  const applyTemplate = (t: typeof templates[0]) => {
    setFormData({
      name: t.label,
      cron: t.cron,
      task_template: t.template,
      agent: t.agent,
      description: `Auto-scheduled: ${t.label}`,
    });
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Agent Scheduler",
        description: "Automate agent tasks on cron schedules",
        icon: Calendar,
      }}
    >
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Calendar} label="Schedules" value={String(stats.total)} sub={`${stats.enabled} enabled`} color="text-blue-400" />
          <StatCard icon={Play} label="Total Runs" value={String(stats.total_runs)} color="text-emerald-400" />
          <StatCard icon={Bot} label="Agents" value={String(Object.keys(stats.agents).length)} sub={Object.entries(stats.agents).map(([a, c]) => `${a}=${c}`).join(", ")} color="text-purple-400" />
          <StatCard icon={ToggleRight} label="Enabled" value={`${stats.total > 0 ? Math.round((stats.enabled / stats.total) * 100) : 0}%`} color="text-amber-400" />
        </div>
      )}

      {/* Add button */}
      <div className="mb-4">
        <Button onClick={() => setShowForm(!showForm)} className="text-xs">
          <Plus className="size-4 mr-1" /> {showForm ? "Cancel" : "New Schedule"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <DashboardCard title="Create Schedule" className="mb-4">
          {/* Quick templates */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground self-center">Templates:</span>
            {templates.map(t => (
              <Button key={t.label} variant="outline" size="sm" className="text-[10px] h-6" onClick={() => applyTemplate(t)}>
                {t.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Name</label>
              <Input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Daily Health Check"
                className="text-sm h-9"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Cron Expression</label>
              <Input
                value={formData.cron}
                onChange={e => setFormData(p => ({ ...p, cron: e.target.value }))}
                placeholder="0 6 * * *"
                className="text-sm h-9 font-mono"
              />
              <span className="text-[9px] text-muted-foreground">min hour day month weekday</span>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Agent</label>
              <Input
                value={formData.agent}
                onChange={e => setFormData(p => ({ ...p, agent: e.target.value }))}
                placeholder="codex"
                className="text-sm h-9 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Description</label>
              <Input
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
                className="text-sm h-9"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-muted-foreground">Task Template</label>
            <Textarea
              value={formData.task_template}
              onChange={e => setFormData(p => ({ ...p, task_template: e.target.value }))}
              placeholder="Description of the task to run..."
              className="text-sm h-20"
            />
          </div>
          {formError && <p className="text-[10px] text-red-400 mb-2">{formError}</p>}
          <Button onClick={handleAdd} className="text-xs">
            <Calendar className="size-4 mr-1" /> Create Schedule
          </Button>
        </DashboardCard>
      )}

      {/* Schedule list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="size-6 mx-auto mb-2 animate-spin opacity-50" />
          Loading schedules...
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="size-8 mx-auto mb-2 opacity-50" />
          <p>No schedules configured</p>
          <p className="text-[10px] mt-1">Click &quot;New Schedule&quot; to create your first automated task</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <div
              key={s.id}
              className={cn(
                "bg-accent/5 rounded-lg p-4 border transition-colors",
                s.enabled ? "border-border/40" : "border-border/20 opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn(
                      "size-2 rounded-full shrink-0",
                      s.enabled ? "bg-emerald-400" : "bg-gray-500"
                    )} />
                    <span className="text-sm font-semibold">{s.name}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">#{s.id}</Badge>
                    <Badge variant="secondary" className="text-[9px]">
                      <Bot className="size-2.5 mr-1" />{s.agent}
                    </Badge>
                    {s.last_status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px]",
                          s.last_status === "completed" ? "text-emerald-400 border-emerald-500/30" :
                          s.last_status === "failed" ? "text-red-400 border-red-500/30" :
                          "text-amber-400 border-amber-500/30"
                        )}
                      >
                        {s.last_status === "completed" ? <CheckCircle2 className="size-2.5 mr-1" /> :
                         s.last_status === "failed" ? <XCircle className="size-2.5 mr-1" /> :
                         <AlertCircle className="size-2.5 mr-1" />}
                        {s.last_status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {s.cron}
                    </span>
                    <span>{s.run_count} runs</span>
                    {s.last_run && (
                      <span>Last: {new Date(s.last_run).toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.task_template}</p>
                  {s.description && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleToggle(s)} title={s.enabled ? "Disable" : "Enable"}>
                    {s.enabled ? <ToggleRight className="size-4 text-emerald-400" /> : <ToggleLeft className="size-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRun(s)} title="Run now">
                    <Play className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-red-400" onClick={() => handleDelete(s.id)} title="Delete">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <DashboardCard title="Cron Reference" className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono">
          <div><span className="text-emerald-400">* * * * *</span> Every minute</div>
          <div><span className="text-emerald-400">0 * * * *</span> Every hour</div>
          <div><span className="text-emerald-400">0 6 * * *</span> Daily at 6 AM</div>
          <div><span className="text-emerald-400">0 */6 * * *</span> Every 6 hours</div>
          <div><span className="text-emerald-400">0 8 * * 0</span> Sunday 8 AM</div>
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-accent/20 rounded-lg p-3 flex items-center gap-2">
      <Icon className={cn("size-5 shrink-0", color)} />
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-sm font-mono font-bold">{value}</div>
        {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
