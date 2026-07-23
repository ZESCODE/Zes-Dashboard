"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronRight, Plus, User, Bot, MessageSquare, CheckCircle2,
  XCircle, ArrowLeft, ArrowRight, RefreshCw, Clock, ThumbsUp,
  ThumbsDown, MessageCircle, FileText, GitBranch, Shield,
  AlertTriangle, Sparkles, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ────────────── Types ────────────── */

interface StageDef {
  id: string;
  label: string;
  assignee: string | null;
  color: string;
}

interface PipelineItem {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: number;
  stage: string;
  assignee_role: string | null;
  created_at: string;
  updated_at: string;
  feedback_count: number;
  task_ids: number[];
}

interface Feedback {
  id: number;
  item_id: number;
  author: string;
  comment: string;
  decision: string;
  created_at: string;
}

interface PipelineData {
  stages: StageDef[];
  items: PipelineItem[];
  feedback: Feedback[];
  stage_counts: Record<string, number>;
  total: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  title: string;
  is_human: boolean;
  status: string;
}

/* ────────────── Helpers ────────────── */

const STAGE_COLORS: Record<string, string> = {
  backlog: "border-gray-500/30 bg-gray-500/5",
  research: "border-blue-500/30 bg-blue-500/5",
  coding: "border-amber-500/30 bg-amber-500/5",
  qc: "border-purple-500/30 bg-purple-500/5",
  review: "border-rose-500/30 bg-rose-500/5",
  done: "border-emerald-500/30 bg-emerald-500/5",
};

const STAGE_TEXT_COLORS: Record<string, string> = {
  backlog: "text-gray-400",
  research: "text-blue-400",
  coding: "text-amber-400",
  qc: "text-purple-400",
  review: "text-rose-400",
  done: "text-emerald-400",
};

const STAGE_BG: Record<string, string> = {
  backlog: "bg-gray-500/20",
  research: "bg-blue-500/20",
  coding: "bg-amber-500/20",
  qc: "bg-purple-500/20",
  review: "bg-rose-500/20",
  done: "bg-emerald-500/20",
};

const ROLE_ICONS: Record<string, any> = {
  ceo: User,
  researcher: FileText,
  coder: Bot,
  qc: Shield,
};

function timeAgo(ts: string): string {
  const sec = (Date.now() - new Date(ts).getTime()) / 1000;
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

/* ────────────── Main Page ────────────── */

export default function CompanyPipelinePage() {
  const params = useParams();
  const companyId = params.id as string;

  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [roster, setRoster] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "feedback" | "setup">("board");

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Feedback form
  const [feedbackItem, setFeedbackItem] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackDecision, setFeedbackDecision] = useState<"approve" | "reject" | "comment">("comment");

  // Setup form
  const [setupAgents, setSetupAgents] = useState([
    { role: "ceo", name: "", description: "You — human reviewer", capabilities: ["review", "decide"] },
    { role: "researcher", name: "", description: "AI research agent", capabilities: ["research", "analyze"] },
    { role: "coder", name: "", description: "AI coding agent", capabilities: ["implement", "debug"] },
    { role: "qc", name: "", description: "AI quality control", capabilities: ["test", "review"] },
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pipeRes, rostRes] = await Promise.all([
        fetch(`/api/company/pipeline?company=${companyId}&path=get`),
        fetch(`/api/company/pipeline?company=${companyId}&path=roster`),
      ]);
      if (pipeRes.ok) setPipeline(await pipeRes.json());
      if (rostRes.ok) setRoster(await rostRes.json());
    } catch {}
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddItem = async () => {
    if (!newTitle.trim()) return;
    await fetch("/api/company/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_item", company: companyId,
        title: newTitle, description: newDesc,
      }),
    });
    setNewTitle("");
    setNewDesc("");
    fetchData();
  };

  const handleAdvance = async (itemId: number, toStage?: string) => {
    await fetch("/api/company/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "advance", company: companyId,
        item_id: itemId, to_stage: toStage,
      }),
    });
    fetchData();
  };

  const handleFeedback = async (itemId: number) => {
    if (!feedbackText.trim()) return;
    await fetch("/api/company/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "feedback", company: companyId,
        item_id: itemId, author: "CEO",
        comment: feedbackText, decision: feedbackDecision,
      }),
    });
    setFeedbackText("");
    setFeedbackItem(null);
    fetchData();
  };

  const handleSetup = async () => {
    const validAgents = setupAgents.filter(a => a.name.trim());
    if (validAgents.length === 0) return;

    await fetch("/api/company/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_roster", company: companyId,
        agents: validAgents,
      }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <DashboardPageLayout header={{ title: "Pipeline", description: "Loading...", icon: GitBranch }}>
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="size-6 mx-auto mb-2 animate-spin opacity-50" />
          Loading pipeline...
        </div>
      </DashboardPageLayout>
    );
  }

  const stages = pipeline?.stages || [];
  const items = pipeline?.items || [];
  const feedback = pipeline?.feedback || [];
  const stageItems = (stageId: string) => items.filter(i => i.stage === stageId);
  const reviewItems = items.filter(i => i.stage === "review");
  const stagesWithItems = stages.filter(s => stageItems(s.id).length > 0 || s.id === "backlog");

  return (
    <DashboardPageLayout
      header={{
        title: `Pipeline — ${companyId}`,
        description: `${items.length} items · ${feedback.length} feedback · ${roster.length} members`,
        icon: GitBranch,
      }}
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { id: "board" as const, label: "Board", icon: GitBranch },
          { id: "feedback" as const, label: "Feedback Log", icon: MessageSquare },
          { id: "setup" as const, label: "Team Setup", icon: User },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="text-xs"
          >
            <tab.icon className="size-3.5 mr-1" /> {tab.label}
          </Button>
        ))}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* ──────────── BOARD TAB ──────────── */}
      {activeTab === "board" && (
        <>
          {/* New item form */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="New task/item..."
              className="text-sm h-9 flex-1"
              onKeyDown={e => e.key === "Enter" && handleAddItem()}
            />
            <Input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="text-sm h-9 hidden md:block flex-1"
            />
            <Button size="sm" className="text-xs h-9" onClick={handleAddItem}>
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </div>

          {/* Pipeline Board — horizontal scroll */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {stagesWithItems.map(stage => {
                const stageItemsList = stageItems(stage.id);
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "w-64 shrink-0 rounded-xl border p-3",
                      STAGE_COLORS[stage.id] || "border-border/30 bg-accent/5"
                    )}
                  >
                    {/* Stage header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-full", STAGE_BG[stage.id])} />
                        <span className={cn("text-xs font-semibold", STAGE_TEXT_COLORS[stage.id])}>
                          {stage.label}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono">
                        {stageItemsList.length}
                      </Badge>
                    </div>

                    {/* Stage items */}
                    <div className="space-y-2">
                      {stageItemsList.map(item => (
                        <div
                          key={item.id}
                          className="bg-card rounded-lg p-3 border border-border/40 shadow-sm hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-xs font-semibold leading-tight">{item.title}</span>
                            <Badge variant="outline" className="text-[8px] font-mono shrink-0">#{item.id}</Badge>
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                            <span>{timeAgo(item.created_at)}</span>
                            {item.feedback_count > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-400">
                                <MessageSquare className="size-2.5" />{item.feedback_count}
                              </span>
                            )}
                          </div>

                          {/* Stage-specific actions */}
                          <div className="flex gap-1 mt-2 pt-2 border-t border-border/20">
                            {stage.id === "review" && (
                              <Button
                                size="sm"
                                className="text-[9px] h-6 flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                                onClick={() => { setFeedbackItem(item.id); setFeedbackDecision("comment"); }}
                              >
                                <MessageCircle className="size-2.5 mr-1" /> Review
                              </Button>
                            )}
                            {stage.id !== "done" && stage.id !== "review" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[9px] h-6 flex-1"
                                onClick={() => handleAdvance(item.id)}
                              >
                                <ChevronRight className="size-2.5 mr-1" /> Advance
                              </Button>
                            )}
                            {stage.id === "done" && (
                              <span className="text-[9px] text-emerald-400 flex items-center gap-1 px-2">
                                <CheckCircle2 className="size-2.5" /> Complete
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {stageItemsList.length === 0 && (
                        <div className="text-center py-6 text-[10px] text-muted-foreground/50 italic">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inline Review Panel for CEO */}
          {feedbackItem && (
            <DashboardCard title={`Review Item #${feedbackItem}`} className="mt-2 border-rose-500/30">
              <div className="flex gap-2 mb-3">
                {(["approve", "reject", "comment"] as const).map(d => (
                  <Button
                    key={d}
                    variant={feedbackDecision === d ? "default" : "outline"}
                    size="sm"
                    className={cn("text-xs", d === "approve" ? "text-emerald-400" : d === "reject" ? "text-red-400" : "")}
                    onClick={() => setFeedbackDecision(d)}
                  >
                    {d === "approve" ? <ThumbsUp className="size-3 mr-1" /> :
                     d === "reject" ? <ThumbsDown className="size-3 mr-1" /> :
                     <MessageCircle className="size-3 mr-1" />}
                    {d === "approve" ? "Approve → Done" : d === "reject" ? "Reject → Rework" : "Comment"}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Your feedback, instructions, or approval note..."
                  className="text-sm h-20 flex-1"
                />
                <div className="flex flex-col gap-1">
                  <Button size="sm" className="text-xs h-9" onClick={() => handleFeedback(feedbackItem)}>
                    <Send className="size-3 mr-1" /> Send
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-9" onClick={() => setFeedbackItem(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DashboardCard>
          )}
        </>
      )}

      {/* ──────────── FEEDBACK TAB ──────────── */}
      {activeTab === "feedback" && (
        <div className="space-y-2">
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
              <p>No feedback yet</p>
              <p className="text-[10px] mt-1">Items in the &quot;Review&quot; stage are awaiting your input</p>
            </div>
          ) : (
            feedback.map(f => {
              const item = items.find(i => i.id === f.item_id);
              return (
                <div key={f.id} className="bg-accent/5 rounded-lg p-3 border border-border/40">
                  <div className="flex items-center gap-2 mb-1">
                    {f.decision === "approve" ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : f.decision === "reject" ? (
                      <XCircle className="size-4 text-red-400" />
                    ) : (
                      <MessageCircle className="size-4 text-blue-400" />
                    )}
                    <span className="text-xs font-semibold capitalize">{f.author}</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px]",
                      f.decision === "approve" ? "text-emerald-400 border-emerald-500/30" :
                      f.decision === "reject" ? "text-red-400 border-red-500/30" :
                      "text-blue-400 border-blue-500/30"
                    )}>
                      {f.decision}
                    </Badge>
                    {item && (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        on #{item.id} &quot;{item.title.slice(0, 40)}&quot;
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground ml-auto">{timeAgo(f.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.comment}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ──────────── SETUP TAB ──────────── */}
      {activeTab === "setup" && (
        <DashboardCard title="Team Roles — Media Agency">
          <p className="text-[10px] text-muted-foreground mb-4">
            Define the 4 roles for this project. CEO is you (human-in-the-loop).
            Assign names and the pipeline will route tasks through each stage automatically.
          </p>

          <div className="space-y-3 mb-4">
            {setupAgents.map((agent, i) => {
              const isCeo = agent.role === "ceo";
              const Icon = ROLE_ICONS[agent.role] || Bot;
              return (
                <div key={agent.role} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  isCeo ? "border-rose-500/30 bg-rose-500/5" : "border-border/30 bg-accent/5"
                )}>
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center shrink-0",
                    isCeo ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
                  )}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold capitalize">{agent.role}</span>
                      <Badge variant="outline" className={cn(
                        "text-[8px]",
                        isCeo ? "text-rose-400 border-rose-500/30" : "text-blue-400 border-blue-500/30"
                      )}>
                        {isCeo ? "Human" : "AI Agent"}
                      </Badge>
                      <Badge variant="secondary" className="text-[8px]">{agent.description}</Badge>
                    </div>
                    <div className="mt-1">
                      <Input
                        value={agent.name}
                        onChange={e => {
                          const updated = [...setupAgents];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setSetupAgents(updated);
                        }}
                        placeholder={isCeo ? "Your name (e.g., Alex)" : `Agent name (e.g., ${agent.role === "researcher" ? "Athena" : agent.role === "coder" ? "Vulcan" : "Veritas"})`}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleSetup} className="text-xs">
            <User className="size-4 mr-1" /> Save Team & Enable Pipeline
          </Button>

          {/* Current roster */}
          {roster.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">Current Team:</p>
              <div className="flex flex-wrap gap-2">
                {roster.map((a: Agent) => (
                  <Badge
                    key={a.id}
                    variant="outline"
                    className={cn("text-[10px]", a.is_human ? "text-rose-400 border-rose-500/30" : "text-blue-400 border-blue-500/30")}
                  >
                    {a.is_human ? <User className="size-2.5 mr-1" /> : <Bot className="size-2.5 mr-1" />}
                    {a.name} ({a.role})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DashboardCard>
      )}

      {/* Back link */}
      <div className="mt-4">
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href={`/company/${companyId}`}>
            <ArrowLeft className="size-3 mr-1" /> Back to Company
          </Link>
        </Button>
      </div>
    </DashboardPageLayout>
  );
}
