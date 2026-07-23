"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Target, Plus, Check, X, AlertTriangle, ChevronRight,
  ArrowLeft, Sparkles, Zap, Shield, Eye,
} from "lucide-react";
import BracketsIcon from "@/components/icons/brackets";
import BuildingIcon from "@/components/icons/building";

/* --------------- Types --------------- */

interface Epic {
  id: string; name: string; kpi: string; progress: number; status: string;
  tokens_used?: number; last_updated?: string;
}

interface Goal {
  id: string; name: string; description: string; progress: number; status: string;
  epics: Epic[];
}

interface RoadmapData {
  goals: Goal[];
  updated: string;
  total_tokens_used_all_epics: number;
  last_review: string;
}

/* --------------- Helpers --------------- */

function statusColor(status: string): string {
  switch (status) {
    case "on_track": case "completed": return "text-success";
    case "attention": return "text-warning";
    case "blocked": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "on_track": case "completed": return "bg-success";
    case "attention": return "bg-warning";
    case "blocked": return "bg-destructive";
    default: return "bg-muted-foreground";
  }
}

/* --------------- Goal Card --------------- */

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: (g: Goal) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [newEpicName, setNewEpicName] = useState("");
  const [newKpi, setNewKpi] = useState("");

  const addEpic = () => {
    if (!newEpicName.trim()) return;
    const epic: Epic = {
      id: "epic-" + Date.now(),
      name: newEpicName.trim(),
      kpi: newKpi.trim() || "TBD",
      progress: 0,
      status: "pending",
    };
    onUpdate({ ...goal, epics: [...goal.epics, epic] });
    setNewEpicName("");
    setNewKpi("");
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Goal Header */}
      <div className="p-4 cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className={"size-3 rounded-full shrink-0 " + statusBg(goal.status)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm">{goal.name}</span>
              <Badge variant="outline" className={"text-[9px] " + statusColor(goal.status)}>{goal.status}</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{goal.description}</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <div className="font-mono font-bold">{goal.progress}%</div>
              <div className="text-[9px] text-muted-foreground">{goal.epics.length} epics</div>
            </div>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={"h-full rounded-full transition-all " + (goal.progress >= 80 ? "bg-success" : goal.progress >= 40 ? "bg-warning" : "bg-destructive")}
                style={{ width: goal.progress + "%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Epics */}
      {expanded && (
        <div className="border-t border-border/30 px-4 py-3 space-y-2">
          {goal.epics.map((epic) => (
            <div key={epic.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-accent/10 transition-colors">
              <div className={"size-2 rounded-full shrink-0 " + statusBg(epic.status)} />
              <span className="text-xs flex-1">{epic.name}</span>
              <span className="text-[9px] text-muted-foreground font-mono hidden md:inline">{epic.kpi}</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                  <div className={"h-full rounded-full " + (epic.progress >= 80 ? "bg-success" : epic.progress >= 40 ? "bg-warning" : "bg-destructive")}
                    style={{ width: epic.progress + "%" }} />
                </div>
                <span className={"text-[10px] font-mono w-8 text-right " + statusColor(epic.status)}>{epic.progress}%</span>
              </div>
            </div>
          ))}

          {/* Add Epic */}
          <div className="flex items-center gap-2 pt-1">
            <Input value={newEpicName} onChange={(e) => setNewEpicName(e.target.value)}
              placeholder="New epic name..." className="h-7 text-xs"
              onKeyDown={(e) => e.key === "Enter" && addEpic()}
            />
            <Input value={newKpi} onChange={(e) => setNewKpi(e.target.value)}
              placeholder="KPI" className="h-7 text-xs w-24"
              onKeyDown={(e) => e.key === "Enter" && addEpic()}
            />
            <Button size="sm" className="h-7 text-[10px]" onClick={addEpic} disabled={!newEpicName.trim()}>
              <Plus className="size-3 mr-1" /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------- New Goal Dialog --------------- */

function NewGoalDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (g: Goal) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background border border-border/40 rounded-xl p-6 w-[420px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-display font-bold mb-4 flex items-center gap-2">
          <Target className="size-4 text-primary" />
          New Strategic Goal
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Goal Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Market Expansion"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="What does this goal entail?"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim()} onClick={() => {
            onCreate({
              id: "g-" + Date.now(), name: name.trim(),
              description: desc.trim() || "New strategic initiative",
              progress: 0, status: "pending", epics: [],
            });
            onClose();
          }}>Create Goal</Button>
        </div>
      </div>
    </div>
  );
}

/* --------------- Page --------------- */

export default function StrategyPage() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewGoal, setShowNewGoal] = useState(false);

  const fetchRoadmap = useCallback(async () => {
    try {
      const res = await fetch("/api/company/budget", { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      // Build roadmap from goals in budget response
      const goals = (data.goals || []).map((g: any) => ({
        id: g.id, name: g.name, description: g.description || "",
        progress: g.progress || 0, status: g.status || "pending",
        epics: g.epics || [],
      }));
      setRoadmap({
        goals, updated: new Date().toISOString(),
        total_tokens_used_all_epics: 0, last_review: "",
      });
    } catch (e: any) {
      // Fallback: try to load from roadmap.json directly
      try {
        const fallback = await fetch("/api/company/tracker", { signal: AbortSignal.timeout(3000) });
        if (fallback.ok) {
          const fd = await fallback.json();
          setRoadmap({
            goals: fd.epics?.map((e: any, i: number) => ({
              id: "g-" + i, name: e.name || "Epic " + i,
              description: "", progress: e.progress || 0,
              status: e.status || "pending", epics: [],
            })) || [], updated: "", total_tokens_used_all_epics: fd.total_tokens || 0, last_review: "",
          });
        }
      } catch {}
      if (!roadmap) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

  const updateGoal = (updated: Goal) => {
    if (!roadmap) return;
    setRoadmap({
      ...roadmap,
      goals: roadmap.goals.map(g => g.id === updated.id ? updated : g),
    });
  };

  const addGoal = (goal: Goal) => {
    if (!roadmap) return;
    setRoadmap({ ...roadmap, goals: [...roadmap.goals, goal] });
  };

  const stats = roadmap ? {
    total: roadmap.goals.length,
    onTrack: roadmap.goals.filter(g => g.status === "on_track" || g.status === "completed").length,
    attention: roadmap.goals.filter(g => g.status === "attention" || g.status === "blocked").length,
    avgProgress: Math.round(roadmap.goals.reduce((s, g) => s + g.progress, 0) / Math.max(roadmap.goals.length, 1)),
  } : null;

  return (
    <DashboardPageLayout
      header={{
        title: "Strategy",
        description: "Strategic goals, epics, and KPI tracking",
        icon: Target,
        actions: (
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setShowNewGoal(true)}>
            <Plus className="size-3 mr-1" /> New Goal
          </Button>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading strategy...</div>
        </div>
      ) : error && !roadmap ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRoadmap}>RETRY</Button>
        </div>
      ) : roadmap ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <DashboardStat label="GOALS" value={String(stats?.total ?? 0)} description="Strategic initiatives" icon={Target}
              intent={(stats?.total ?? 0) > 0 ? "positive" : "neutral"} direction={stats && stats.onTrack > stats.attention ? "up" : "down"} />
            <DashboardStat label="ON TRACK" value={String(stats?.onTrack ?? 0)} description="Meeting KPIs" icon={Shield}
              intent={(stats?.onTrack ?? 0) > 0 ? "positive" : "neutral"} direction="up" />
            <DashboardStat label="NEEDS ATTENTION" value={String(stats?.attention ?? 0)} description="Blocked or behind" icon={AlertTriangle}
              intent={(stats?.attention ?? 0) > 0 ? "warning" : "positive"} direction={stats && stats.attention > 0 ? "down" : "up"} />
            <DashboardStat label="AVG PROGRESS" value={String(stats?.avgProgress ?? 0) + "%"} description="Across all goals" icon={Eye}
              intent={stats && stats.avgProgress >= 60 ? "positive" : stats && stats.avgProgress >= 30 ? "warning" : "negative"} direction="up" />
          </div>

          {/* Goals */}
          <div className="space-y-4">
            {roadmap.goals.length > 0 ? roadmap.goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} />
            )) : (
              <div className="flex flex-col items-center py-16 gap-3">
                <Target className="size-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No strategic goals defined yet</p>
                <Button size="sm" onClick={() => setShowNewGoal(true)}>
                  <Sparkles className="size-3 mr-1" /> Define First Goal
                </Button>
              </div>
            )}
          </div>
        </>
      ) : null}

      {showNewGoal && (
        <NewGoalDialog
          onClose={() => setShowNewGoal(false)}
          onCreate={(g) => { addGoal(g); }}
        />
      )}
    </DashboardPageLayout>
  );
}
