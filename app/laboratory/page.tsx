"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import DashboardChart from "@/components/dashboard/chart";
import AtomIcon from "@/components/icons/atom";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import BoomIcon from "@/components/icons/boom";
import CuteRobotIcon from "@/components/icons/cute-robot";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getHealth, getSystemInfo, type ServiceHealth, type SystemInfo } from "@/lib/api-client";
import {
  Users, Zap, Play, Save, Sparkles, Plus,
  Code, Terminal, Trash2, Copy,
} from "lucide-react";

/* ────────────── Types ────────────── */

interface Experiment {
  id: string; name: string; description: string;
  status: "running" | "stopped" | "error";
  progress: number; lastRun: string; category: string;
}

interface Company {
  id: string; name: string; agentCount?: number; isPrimary?: boolean;
}

/* ────────────── Default Data ────────────── */

const defaultExperiments: Experiment[] = [
  { id: "exp-1", name: "Neural Scan", description: "Pattern recognition & anomaly detection", status: "running", progress: 78, lastRun: "Now", category: "ml" },
  { id: "exp-2", name: "Packet Analyzer", description: "Real-time network traffic analysis", status: "running", progress: 45, lastRun: "Now", category: "network" },
  { id: "exp-3", name: "Memory Weaver", description: "Distributed memory compression", status: "stopped", progress: 100, lastRun: "2h ago", category: "system" },
  { id: "exp-4", name: "Guardian AI", description: "Autonomous threat response", status: "stopped", progress: 62, lastRun: "5h ago", category: "ml" },
  { id: "exp-5", name: "Mesh Topology", description: "Network mesh discovery & mapping", status: "running", progress: 33, lastRun: "Now", category: "network" },
  { id: "exp-6", name: "Resource Optimizer", description: "Dynamic resource allocation engine", status: "error", progress: 89, lastRun: "Failed", category: "system" },
];

const categoryColors: Record<string, string> = {
  ml: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  network: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  system: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  monitor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const promptTemplates = [
  { id: "code-review", name: "Code Review", prompt: "Review the following code for issues, bugs, and improvements:\n\n```\n[Paste code here]\n```\n\nFocus on: security, performance, readability." },
  { id: "arch-decision", name: "Architecture Decision", prompt: "We need to decide on the architecture for [project].\n\nRequirements:\n- \n- \n- \n\nOptions:\n1. \n2. \n\nRecommend the best approach with tradeoffs." },
  { id: "debug", name: "Debug Help", prompt: "I'm getting this error:\n\n```\n[Paste error here]\n```\n\nContext:\n- \n- \n\nWhat's causing this and how do I fix it?" },
  { id: "brainstorm", name: "Brainstorm", prompt: "Brainstorm ideas for [topic].\n\nConstraints:\n- \n- \n\nGenerate at least 5 creative approaches and rank them by feasibility." },
];

/* ────────────── Tab: Experiments ────────────── */

function ExperimentsTab({ experiments, toggleExperiment }: {
  experiments: Experiment[];
  toggleExperiment: (id: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className={cn(
              "rounded-lg border p-4 transition-all duration-300 hover:border-primary/30",
              exp.status === "running"
                ? "border-success/30 bg-success/5"
                : exp.status === "error"
                ? "border-destructive/30 bg-destructive/5"
                : "border-border/40 bg-accent/10"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bullet
                  variant={exp.status === "running" ? "success" : exp.status === "error" ? "destructive" : "default"}
                />
                <span className="font-display text-sm">{exp.name}</span>
              </div>
              <Badge variant="outline" className={cn("text-[9px] uppercase", categoryColors[exp.category])}>
                {exp.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{exp.description}</p>
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Progress</span>
                <span className={cn(
                  "font-mono font-bold",
                  exp.status === "running" ? "text-success" : exp.status === "error" ? "text-destructive" : "text-muted-foreground"
                )}>{exp.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    exp.status === "running" ? "bg-success" : exp.status === "error" ? "bg-destructive" : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${exp.progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-mono">Last: {exp.lastRun}</span>
              <Button
                variant={exp.status === "running" ? "outline" : "default"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => toggleExperiment(exp.id)}
                disabled={exp.status === "error"}
              >
                {exp.status === "running" ? "STOP" : exp.status === "error" ? "FAILED" : "START"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ────────────── Tab: Hire ────────────── */

function HireTab({ companies, onHired }: { companies: Company[]; onHired: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("engineer");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [budgetMonthly, setBudgetMonthly] = useState("200000");
  const [capabilities, setCapabilities] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Agent name is required" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const agentData = {
        name: name.trim(),
        role,
        title: title.trim() || role.charAt(0).toUpperCase() + role.slice(1),
        description: description.trim(),
        reportsTo: reportsTo || null,
        budgetMonthlyCents: parseInt(budgetMonthly) || 200000,
        spentMonthCents: 0,
        status: "planned",
        capabilities: capabilities.split(",").map((c) => c.trim()).filter(Boolean),
        adapterType: role === "communicator" ? "claude" : "codex",
        lastHeartbeat: "",
      };

      if (targetCompany) {
        // Add to selected company
        const res = await fetch(`/api/company/${targetCompany}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add-agent", agent: agentData }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to hire agent");
        }
      } else {
        // Add via companies_manager CLI
        const res = await fetch("/api/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() + "-team",
            description: `Team led by ${name.trim()}`,
            budget_cents: parseInt(budgetMonthly) * 3 || 500000,
            agent_types: ["lead", "assistant", "specialist"],
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create team");
        }
      }

      setMessage({ type: "ok", text: `Agent "${name.trim()}" hired successfully!` });
      setName(""); setTitle(""); setDescription(""); setCapabilities("");
      onHired();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nova, Atlas, Echo"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="engineer">Engineer</option>
              <option value="communicator">Communicator</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="ceo">CEO / Lead</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Research Engineer"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the agent's purpose and focus..."
            className="min-h-[60px] text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reports To</label>
            <Input
              value={reportsTo}
              onChange={(e) => setReportsTo(e.target.value)}
              placeholder="Agent ID (or leave blank for top-level)"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Budget (cents)</label>
            <Input
              value={budgetMonthly}
              onChange={(e) => setBudgetMonthly(e.target.value)}
              placeholder="200000 = $2000"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capabilities (comma-separated)</label>
          <Input
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            placeholder="e.g. research, analysis, implementation, testing"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Target Company <span className="font-normal lowercase">(optional — leave blank to create new team)</span>
          </label>
          <select
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Create new company group (3 agents) —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.isPrimary ? "(Primary)" : ""}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className={cn(
            "rounded-lg p-3 text-xs",
            message.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          )}>
            {message.text}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={submitting} className="h-9 text-xs gap-1.5">
          {submitting ? (
            <>HIRING...</>
          ) : (
            <><Users className="size-3.5" /> HIRE AGENT</>
          )}
        </Button>
      </div>

      {/* Sidebar: preview */}
      <div className="space-y-4">
        <div className="bg-accent/15 rounded-lg p-4">
          <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="size-3" />
            Hiring Tips
          </h3>
          <ul className="space-y-2 text-[11px] text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Give agents clear, specific names</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Capabilities help route tasks to the right agent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Set realistic monthly budgets per agent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Creating a new company spawns a 3-agent team</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Use Org Chart to visualize the hierarchy</span>
            </li>
          </ul>
        </div>

        <div className="bg-accent/15 rounded-lg p-4">
          <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-2">Quick Templates</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] justify-start"
              onClick={() => { setName("Researcher"); setRole("engineer"); setTitle("Research Engineer"); setCapabilities("research, analysis, data-processing"); setBudgetMonthly("250000"); }}
            >
              <CuteRobotIcon className="size-3 mr-1.5" /> Research Agent
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] justify-start"
              onClick={() => { setName("Architect"); setRole("engineer"); setTitle("System Architect"); setCapabilities("architecture, planning, design"); setBudgetMonthly("300000"); }}
            >
              <CuteRobotIcon className="size-3 mr-1.5" /> System Architect
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] justify-start"
              onClick={() => { setName("Monitor"); setRole("infrastructure"); setTitle("Monitoring Agent"); setCapabilities("monitoring, alerting, logging"); setBudgetMonthly("150000"); }}
            >
              <CuteRobotIcon className="size-3 mr-1.5" /> Monitor Agent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────── Tab: Playground ────────────── */

function PlaygroundTab() {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [running, setRunning] = useState(false);
  const [vars, setVars] = useState<Record<string, string>>({});

  const applyTemplate = (id: string) => {
    const tmpl = promptTemplates.find((t) => t.id === id);
    if (tmpl) {
      setPrompt(tmpl.prompt);
      setActiveTemplate(id);
      setResponse("");
    }
  };

  const extractVars = (text: string): string[] => {
    const matches = text.match(/\[([^\]]+)\]/g);
    return matches ? [...new Set(matches.map((m) => m.slice(1, -1)))] : [];
  };

  const handlePromptChange = (text: string) => {
    setPrompt(text);
    const found = extractVars(text);
    const newVars: Record<string, string> = {};
    for (const v of found) {
      newVars[v] = vars[v] || "";
    }
    setVars(newVars);
  };

  const fillPrompt = (): string => {
    let result = prompt;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`[${key}]`, value || `[${key}]`);
    }
    return result;
  };

  const runPrompt = async () => {
    setRunning(true);
    setResponse("");
    try {
      const filled = fillPrompt();
      const title = activeTemplate
        ? promptTemplates.find(t => t.id === activeTemplate)?.name + " Task"
        : "Playground Task: " + filled.substring(0, 60);

      // Create a real task in the queue
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.substring(0, 120),
          description: filled.substring(0, 2000),
          priority: 3,
        }),
      });
      const data = await res.json();

      if (data.task_id) {
        setResponse(
          `✅ Task #${data.task_id} created in the dispatch queue.\n\n` +
          `Prompt length: ${filled.length} characters\n` +
          `Variables: ${Object.keys(vars).filter(k => vars[k]).length > 0
            ? Object.entries(vars).filter(([,v]) => v).map(([k,v]) => `${k}=${v}`).join(', ')
            : 'none'}\n\n` +
          `View it on the Orchestrator page →\n\n` +
          `--- Your Prompt ---\n${filled.substring(0, 500)}${filled.length > 500 ? '...' : ''}`
        );
      } else {
        setResponse(`⚠️ Task created but no ID returned.\n\nPrompt: ${filled.substring(0, 300)}`);
      }
    } catch (e: any) {
      setResponse(`Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const templateVars = extractVars(prompt);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Template sidebar */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-2">Templates</h3>
        {promptTemplates.map((tmpl) => (
          <Button
            key={tmpl.id}
            variant={activeTemplate === tmpl.id ? "default" : "outline"}
            size="sm"
            className={cn("w-full h-8 text-[11px] justify-start gap-2", activeTemplate === tmpl.id && "text-xs")}
            onClick={() => applyTemplate(tmpl.id)}
          >
            <Code className="size-3" />
            {tmpl.name}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-[10px] justify-start text-muted-foreground"
          onClick={() => { setActiveTemplate(null); setPrompt(""); setResponse(""); setVars({}); }}
        >
          <Trash2 className="size-3 mr-1.5" /> Clear
        </Button>
      </div>

      {/* Editor */}
      <div className="lg:col-span-2 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
            <span className="text-[10px] text-muted-foreground">{prompt.length} chars</span>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Write a prompt with [variables] in brackets..."
            className="min-h-[200px] text-sm font-mono"
          />
        </div>

        {templateVars.length > 0 && (
          <div className="bg-accent/15 rounded-lg p-3 space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Variables</h4>
            {templateVars.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground w-28">[{v}]</span>
                <Input
                  value={vars[v] || ""}
                  onChange={(e) => setVars({ ...vars, [v]: e.target.value })}
                  placeholder={`Enter ${v}...`}
                  className="h-7 text-xs"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={runPrompt} disabled={running || !prompt.trim()} className="h-8 text-xs gap-1.5">
            {running ? <><Terminal className="size-3.5 animate-spin" /> RUNNING...</> : <><Play className="size-3.5" /> RUN PROMPT</>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => { navigator.clipboard?.writeText(prompt); }}
          >
            <Copy className="size-3" /> COPY
          </Button>
        </div>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground flex items-center gap-1.5">
          <Terminal className="size-3" />
          Output
        </h3>
        <div className="bg-black/80 rounded-lg p-4 min-h-[200px] font-mono text-[11px] leading-relaxed">
          {running ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Processing...
            </div>
          ) : response ? (
            <pre className="whitespace-pre-wrap text-green-400/90">{response}</pre>
          ) : (
            <span className="text-muted-foreground/50">Output will appear here...</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────── Main Page ────────────── */

export default function LaboratoryPage() {
  const [experiments, setExperiments] = useState<Experiment[]>(defaultExperiments);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeTab, setActiveTab] = useState<"experiments" | "hire" | "playground">("experiments");

  useEffect(() => {
    const fetchData = async () => {
      const [health, system] = await Promise.all([getHealth(), getSystemInfo()]);
      if (health) setServices(health);
      if (system) setSysInfo(system);
      // Fetch companies for hire tab
      try {
        const res = await fetch("/api/company");
        if (res.ok) {
          const data = await res.json();
          const list: Company[] = [];
          if (data.primary) list.push(data.primary);
          if (data.companies) list.push(...data.companies);
          setCompanies(list);
        }
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleExperiment = (id: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? { ...exp, status: exp.status === "running" ? "stopped" : "running", lastRun: "Now" }
          : exp
      )
    );
  };

  const activeExpCount = experiments.filter((e) => e.status === "running").length;
  const runningServices = services.filter((s) => s.running).length;

  const tabs = [
    { id: "experiments" as const, label: "Experiments", icon: AtomIcon },
    { id: "hire" as const, label: "Hire", icon: Users },
    { id: "playground" as const, label: "Playground", icon: Code },
  ];

  return (
    <DashboardPageLayout
      header={{
        title: "Laboratory",
        description: "Experiments · Hire Agents · Prompt Playground",
        icon: AtomIcon,
      }}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardStat
          label="ACTIVE EXPERIMENTS"
          value={`${activeExpCount}`}
          description={`OF ${experiments.length} TOTAL`}
          icon={AtomIcon}
          intent={activeExpCount > 0 ? "positive" : "negative"}
          direction="up"
        />
        <DashboardStat
          label="SERVICES ONLINE"
          value={`${runningServices}`}
          description={services.length ? `OF ${services.length} TOTAL` : "LOADING..."}
          icon={GearIcon}
          intent={runningServices > 0 ? "positive" : "negative"}
          direction={runningServices > 2 ? "up" : "down"}
        />
        <DashboardStat
          label="CPU LOAD"
          value={sysInfo ? `${sysInfo.load[0]?.toFixed(1) ?? "0.0"}` : "0.0"}
          description="LOAD AVERAGE (1m)"
          icon={ProcessorIcon}
          intent={sysInfo && sysInfo.load[0] > 2 ? "negative" : "positive"}
          direction={sysInfo && sysInfo.load[0] > 2 ? "up" : "down"}
        />
        <DashboardStat
          label="COMPANIES"
          value={`${companies.length}`}
          description="ACTIVE GROUPS"
          icon={Users}
          intent={companies.length > 0 ? "positive" : "negative"}
          direction={companies.length > 1 ? "up" : "down"}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-accent/20 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "experiments" && (
        <DashboardCard
          title="ACTIVE EXPERIMENTS"
          intent={activeExpCount > 0 ? "success" : "default"}
          addon={
            <Badge variant={activeExpCount > 0 ? "default" : "secondary"}>
              <span className={cn("inline-block size-1.5 rounded-full mr-1.5", activeExpCount > 0 ? "bg-success" : "bg-muted-foreground")} />
              {activeExpCount} RUNNING
            </Badge>
          }
          className="mb-6"
        >
          <ExperimentsTab experiments={experiments} toggleExperiment={toggleExperiment} />
        </DashboardCard>
      )}

      {activeTab === "hire" && (
        <DashboardCard title="HIRE AGENT" className="mb-6">
          <HireTab companies={companies} onHired={() => {
            // Refresh company list
            fetch("/api/company").then(r => r.ok && r.json()).then(data => {
              const list: Company[] = [];
              if (data.primary) list.push(data.primary);
              if (data.companies) list.push(...data.companies);
              setCompanies(list);
            }).catch(() => {});
          }} />
        </DashboardCard>
      )}

      {activeTab === "playground" && (
        <DashboardCard title="PROMPT PLAYGROUND" className="mb-6">
          <PlaygroundTab />
        </DashboardCard>
      )}

      {/* Chart & System Monitor (always visible) */}
      <div className="mb-6">
        <DashboardChart />
      </div>

      <DashboardCard title="SYSTEM MONITOR" intent="default">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">CPU</span>
              <Bullet variant={sysInfo && sysInfo.load[0] > 2 ? "destructive" : "success"} />
            </div>
            <div className="text-2xl font-display font-bold mb-1">
              {sysInfo ? `${sysInfo.load[0]?.toFixed(1) ?? "0.0"}` : "---"}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">load average</div>
          </div>
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">MEMORY</span>
              <Bullet variant={sysInfo && sysInfo.memory.percent > 80 ? "destructive" : sysInfo && sysInfo.memory.percent > 60 ? "warning" : "success"} />
            </div>
            <div className="text-2xl font-display font-bold mb-1">
              {sysInfo?.memory.used ?? "---"}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">of {sysInfo?.memory.total ?? "---"} total</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  sysInfo && sysInfo.memory.percent > 80 ? "bg-destructive" : sysInfo && sysInfo.memory.percent > 60 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${sysInfo?.memory.percent ?? 0}%` }}
              />
            </div>
          </div>
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">DISK</span>
              <Bullet variant={sysInfo && sysInfo.disk.percent > 85 ? "destructive" : sysInfo && sysInfo.disk.percent > 70 ? "warning" : "success"} />
            </div>
            <div className="text-2xl font-display font-bold mb-1">
              {sysInfo?.disk.used ?? "---"}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">of {sysInfo?.disk.total ?? "---"} total</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  sysInfo && sysInfo.disk.percent > 85 ? "bg-destructive" : sysInfo && sysInfo.disk.percent > 70 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${sysInfo?.disk.percent ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
