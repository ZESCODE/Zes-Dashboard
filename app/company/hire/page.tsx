"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Users, DollarSign, Target, Plus, Check, X,
  AlertTriangle, Sparkles, ChevronRight, ArrowLeft,
} from "lucide-react";
import BuildingIcon from "@/components/icons/building";
import CuteRobotIcon from "@/components/icons/cute-robot";

/* --------------- Types --------------- */

interface Agent {
  id: string; name: string; role: string; title: string; description: string;
  reportsTo: string | null; status: string; adapterType: string;
  budgetMonthlyCents: number; spentMonthCents: number;
  capabilities: string[];
}

interface RosterData {
  company: { id: string; name: string; };
  agents: Agent[];
  orgTree: Agent[];
}

interface FormData {
  name: string; role: string; title: string; description: string;
  reportsTo: string; budgetMonthly: string; capabilities: string;
}

/* --------------- Role options --------------- */

const ROLES = [
  { value: "engineer", label: "Engineer", desc: "Implementation, testing, code review", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "communicator", label: "Communicator", desc: "UI, documentation, user messaging", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { value: "infrastructure", label: "Infrastructure", desc: "API gateway, routing, services", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "ceo", label: "CEO / Strategist", desc: "Orchestration, governance, strategy", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "specialist", label: "Specialist", desc: "Domain-specific expert agent", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];

const CAPABILITY_OPTIONS = [
  "implementation", "testing", "code-review", "memory", "orchestration",
  "strategy", "governance", "documentation", "terminal-ui", "user-messaging",
  "routing", "load-balancing", "service-discovery", "monitoring",
  "multi-agent", "data-analysis", "security", "automation",
];

/* --------------- Step Indicator --------------- */

function Step({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
        done ? "bg-success text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {done ? <Check className="size-3.5" /> : num}
      </div>
      <span className={cn("text-xs", active ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

/* --------------- Page --------------- */

export default function HireAgentPage() {
  const [step, setStep] = useState(1);
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<FormData>({
    name: "", role: "engineer", title: "", description: "",
    reportsTo: "", budgetMonthly: "1000", capabilities: "",
  });

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch("/api/company/roster", { signal: AbortSignal.timeout(5000) });
      if (res.ok) setRoster(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  const agents = roster?.agents || [];
  const canNext = (step === 1 && form.name) || (step === 2 && form.role) || step === 3;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const caps = form.capabilities.split(",").map(c => c.trim()).filter(Boolean);
      const payload = {
        name: form.name,
        role: form.role,
        title: form.title || form.role.charAt(0).toUpperCase() + form.role.slice(1) + " Agent",
        description: form.description || "A " + form.role + "-focused AI agent for ZES.",
        reportsTo: form.reportsTo || "hermes",
        budgetMonthlyCents: Math.round(parseFloat(form.budgetMonthly || "1000") * 100),
        capabilities: caps.length > 0 ? caps : [form.role],
      };
      const res = await fetch("/api/company/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to hire agent");
      }
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Hire Agent",
        description: "Add a new agent to the ZES organization",
        icon: BuildingIcon,
      }}
    >
      {/* Steps */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <Step num={1} label="Identity" active={step === 1} done={step > 1} />
        <ChevronRight className="size-4 text-muted-foreground/40" />
        <Step num={2} label="Role & Budget" active={step === 2} done={step > 2} />
        <ChevronRight className="size-4 text-muted-foreground/40" />
        <Step num={3} label="Capabilities" active={step === 3} done={step > 3} />
        <ChevronRight className="size-4 text-muted-foreground/40" />
        <Step num={4} label="Confirm" active={step === 4} done={success} />
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="size-16 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="size-8 text-success" />
          </div>
          <h2 className="text-xl font-display font-bold">Agent Hired!</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            <strong className="text-foreground">{form.name}</strong> has been added to the ZES organization as a {form.role}.
            Check the org chart to see them in the tree.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/company/org-chart"}>
              View Org Chart
            </Button>
            <Button size="sm" onClick={() => { setStep(1); setSuccess(false); setForm({ name: "", role: "engineer", title: "", description: "", reportsTo: "", budgetMonthly: "1000", capabilities: "" }); }}>
              Hire Another
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Identity */}
          {step === 1 && (
            <DashboardCard title="AGENT IDENTITY">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Agent Name *</label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Nova, Atlas, Orion"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title / Position</label>
                  <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Senior ML Engineer, Security Analyst"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                  <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="What does this agent do? What are their responsibilities?"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button size="sm" disabled={!form.name} onClick={() => setStep(2)}>
                    Next: Role & Budget <ChevronRight className="size-3 ml-1" />
                  </Button>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Step 2: Role & Budget */}
          {step === 2 && (
            <DashboardCard title="ROLE & BUDGET">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Role *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button key={r.value} onClick={() => setForm({...form, role: r.value})}
                        className={cn(
                          "text-left rounded-lg border p-3 transition-all hover:border-primary/40",
                          form.role === r.value ? "border-primary/50 ring-1 ring-primary/30 " + r.color : "border-border/40"
                        )}
                      >
                        <div className="text-xs font-medium">{r.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Monthly Budget ($)</label>
                    <input type="number" value={form.budgetMonthly} onChange={(e) => setForm({...form, budgetMonthly: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reports To</label>
                    <select value={form.reportsTo} onChange={(e) => setForm({...form, reportsTo: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">CEO (Hermes)</option>
                      {agents.filter(a => a.role !== form.role).map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}><ArrowLeft className="size-3 mr-1" /> Back</Button>
                  <Button size="sm" disabled={!form.role} onClick={() => setStep(3)}>
                    Next: Capabilities <ChevronRight className="size-3 ml-1" />
                  </Button>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Step 3: Capabilities */}
          {step === 3 && (
            <DashboardCard title="CAPABILITIES">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Select capabilities (click to toggle)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CAPABILITY_OPTIONS.map((cap) => {
                      const selected = form.capabilities.includes(cap);
                      return (
                        <button key={cap} onClick={() => {
                          const caps = form.capabilities ? form.capabilities.split(",").map(c => c.trim()) : [];
                          const updated = selected ? caps.filter(c => c !== cap) : [...caps, cap];
                          setForm({...form, capabilities: updated.join(",")});
                        }}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] border transition-all",
                            selected ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/30"
                          )}
                        >{cap}</button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Or type custom capabilities (comma separated)</label>
                  <Input value={form.capabilities} onChange={(e) => setForm({...form, capabilities: e.target.value})}
                    placeholder="e.g. data-analysis, security, monitoring"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}><ArrowLeft className="size-3 mr-1" /> Back</Button>
                  <Button size="sm" onClick={() => setStep(4)}>
                    Review & Confirm <ChevronRight className="size-3 ml-1" />
                  </Button>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <DashboardCard title="CONFIRM AGENT">
              <div className="space-y-4">
                <div className="bg-accent/15 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">{form.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Role</span>
                    <Badge variant="outline" className={"text-[10px] " + (ROLES.find(r => r.value === form.role)?.color || "")}>{form.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Title</span>
                    <span className="text-sm">{form.title || form.role.charAt(0).toUpperCase() + form.role.slice(1) + " Agent"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Budget</span>
                    <span className="font-mono font-bold">${form.budgetMonthly}/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Reports To</span>
                    <span className="text-sm font-medium">{form.reportsTo ? agents.find(a => a.id === form.reportsTo)?.name || form.reportsTo : "Hermes (CEO)"}</span>
                  </div>
                  {(form.capabilities || form.role) && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1.5">Capabilities</div>
                      <div className="flex flex-wrap gap-1">
                        {(form.capabilities ? form.capabilities.split(",").map(c => c.trim()) : [form.role]).filter(Boolean).map((cap) => (
                          <span key={cap} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary">{cap}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-3">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(3)}><ArrowLeft className="size-3 mr-1" /> Back</Button>
                  <Button size="sm" disabled={submitting} onClick={handleSubmit}>
                    {submitting ? (
                      <>Hiring...</>
                    ) : (
                      <><Sparkles className="size-3 mr-1" /> Hire {form.name}</>
                    )}
                  </Button>
                </div>
              </div>
            </DashboardCard>
          )}
        </div>
      )}
    </DashboardPageLayout>
  );
}
