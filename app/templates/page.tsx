"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Plus, Trash2, Play, Bot, Tag, Layers,
  Search, RefreshCw, Sparkles, Variable, CheckCircle2,
  AlertCircle, X, BookTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SelectSearch from "@/components/ui/select-search";
/* ────────────── Types ────────────── */

interface TemplateVariable {
  name: string;
  label: string;
  type: string;
  default: string;
  required: boolean;
}

interface Template {
  id: number;
  name: string;
  category: string;
  description: string;
  content: string;
  variables: TemplateVariable[];
  agent: string;
  tags: string[];
  created_at: string;
  use_count: number;
}

interface TemplateStats {
  total: number;
  categories: Record<string, number>;
  agents: Record<string, number>;
  total_uses: number;
}

/* ────────────── Helpers ────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  development: "bg-blue-500/20 text-blue-400",
  security: "bg-rose-500/20 text-rose-400",
  operations: "bg-amber-500/20 text-amber-400",
  knowledge: "bg-purple-500/20 text-purple-400",
  general: "bg-gray-500/20 text-gray-400",
};

const AGENT_COLORS: Record<string, string> = {
  codex: "bg-emerald-500/20 text-emerald-400",
  claude: "bg-amber-500/20 text-amber-400",
  hermes: "bg-purple-500/20 text-purple-400",
};

/* ────────────── Main Page ────────────── */

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // Instantiation
  const [instantiateId, setInstantiateId] = useState<number | null>(null);
  const [instForm, setInstForm] = useState<Record<string, string>>({});
  const [instResult, setInstResult] = useState<string | null>(null);
  const [instError, setInstError] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    category: "general",
    description: "",
    content: "",
    agent: "codex",
    tags: "",
  });
  const [createVars, setCreateVars] = useState<TemplateVariable[]>([]);
  const [createResult, setCreateResult] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, statRes] = await Promise.all([
        fetch(`/api/task-templates?path=list&category=${filterCat}&search=${search}`),
        fetch("/api/task-templates?path=stats"),
      ]);
      if (tplRes.ok) setTemplates(await tplRes.json());
      if (statRes.ok) setStats(await statRes.json());
    } catch {}
    setLoading(false);
  }, [filterCat, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openInstantiate = (t: Template) => {
    setInstantiateId(t.id);
    const defaults: Record<string, string> = {};
    t.variables.forEach(v => { defaults[v.name] = v.default || ""; });
    setInstForm(defaults);
    setInstResult(null);
    setInstError("");
  };

  const handleInstantiate = async (tid: number) => {
    setInstError("");
    setInstResult(null);
    try {
      const res = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "instantiate", id: tid, variables: instForm }),
      });
      const data = await res.json();
      if (data.error) {
        setInstError(data.error);
      } else {
        setInstResult(data.status || data.output || "done");
        fetchData();
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/task-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    fetchData();
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.content.trim()) {
      setCreateResult("Name and content required");
      return;
    }
    try {
      const res = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          ...createForm,
          variables: createVars,
          tags: createForm.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.error) setCreateResult(data.error);
      else {
        setCreateResult(`Created template #${data.id}`);
        setShowCreate(false);
        setCreateForm({ name: "", category: "general", description: "", content: "", agent: "codex", tags: "" });
        setCreateVars([]);
        fetchData();
      }
    } catch {}
  };

  const addCreateVar = () => {
    setCreateVars([...createVars, { name: "", label: "", type: "text", default: "", required: false }]);
  };

  const updateCreateVar = (i: number, field: string, value: any) => {
    const updated = [...createVars];
    (updated[i] as any)[field] = value;
    setCreateVars(updated);
  };

  const removeCreateVar = (i: number) => {
    setCreateVars(createVars.filter((_, idx) => idx !== i));
  };

  const categories = stats ? Object.keys(stats.categories) : [];

  return (
    <DashboardPageLayout
      header={{
        title: "Task Templates",
        description: "Reusable blueprints for common agent operations",
        icon: BookTemplate,
      }}
    >
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={BookTemplate} label="Templates" value={String(stats.total)} color="text-blue-400" />
          <StatCard icon={Layers} label="Categories" value={String(Object.keys(stats.categories).length)} sub={Object.entries(stats.categories).map(([c, n]) => `${c}=${n}`).join(", ")} color="text-purple-400" />
          <StatCard icon={Bot} label="Agents" value={String(Object.keys(stats.agents).length)} sub={Object.entries(stats.agents).map(([a, n]) => `${a}=${n}`).join(", ")} color="text-emerald-400" />
          <StatCard icon={Play} label="Total Uses" value={String(stats.total_uses)} color="text-amber-400" />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9 text-sm w-48 md:w-64 h-9"
          />
        </div>
        <div className="flex gap-1">
          <Button variant={!filterCat ? "default" : "outline"} size="sm" className="text-[10px] h-7"
            onClick={() => setFilterCat("")}>All</Button>
          {categories.map(c => (
            <Button key={c} variant={filterCat === c ? "default" : "outline"} size="sm"
              className={cn("text-[10px] h-7 capitalize", CATEGORY_COLORS[c])}
              onClick={() => setFilterCat(c)}>{c}</Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
        <Button onClick={() => setShowCreate(!showCreate)} className="text-xs">
          <Plus className="size-4 mr-1" /> New Template
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <DashboardCard title="Create Template" className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Name *</label>
              <Input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                className="text-sm h-9" placeholder="Code Review" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Category</label>
              <select value={createForm.category}
                onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm">
                <option value="development">development</option>
                <option value="security">security</option>
                <option value="operations">operations</option>
                <option value="knowledge">knowledge</option>
                <option value="general">general</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Agent</label>
              <Input value={createForm.agent} onChange={e => setCreateForm(p => ({ ...p, agent: e.target.value }))}
                className="text-sm h-9 font-mono" placeholder="codex" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Tags (comma separated)</label>
              <Input value={createForm.tags} onChange={e => setCreateForm(p => ({ ...p, tags: e.target.value }))}
                className="text-sm h-9" placeholder="review, quality" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-muted-foreground">Description</label>
            <Input value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
              className="text-sm h-9" placeholder="Brief description of the template" />
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-muted-foreground">Content * (use {'{{variable_name}}'} for placeholders)</label>
            <Textarea value={createForm.content} onChange={e => setCreateForm(p => ({ ...p, content: e.target.value }))}
              className="text-sm h-32 font-mono" placeholder="Task description with {{variable}} placeholders..." />
          </div>

          {/* Variables */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Variable className="size-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">Variables</span>
              <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={addCreateVar}>
                <Plus className="size-3 mr-1" /> Add
              </Button>
            </div>
            {createVars.map((v, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <Input value={v.name} onChange={e => updateCreateVar(i, "name", e.target.value)}
                  className="text-[10px] h-7 w-28 font-mono" placeholder="var_name" />
                <Input value={v.label} onChange={e => updateCreateVar(i, "label", e.target.value)}
                  className="text-[10px] h-7 w-32" placeholder="Label" />
                <Input value={v.default} onChange={e => updateCreateVar(i, "default", e.target.value)}
                  className="text-[10px] h-7 w-28" placeholder="Default" />
                <label className="flex items-center gap-1 text-[10px]">
                  <input type="checkbox" checked={v.required}
                    onChange={e => updateCreateVar(i, "required", e.target.checked)} />
                  Required
                </label>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeCreateVar(i)}>
                  <X className="size-3 text-red-400" />
                </Button>
              </div>
            ))}
          </div>

          {createResult && <p className="text-[10px] mb-2">{createResult}</p>}
          <Button onClick={handleCreate} className="text-xs">
            <Plus className="size-4 mr-1" /> Create Template
          </Button>
        </DashboardCard>
      )}

      {/* Template cards */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="size-6 mx-auto mb-2 animate-spin opacity-50" />
          Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookTemplate className="size-8 mx-auto mb-2 opacity-50" />
          <p>No templates found{search ? ` for "${search}"` : ""}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map(t => (
            <div key={t.id} className="bg-accent/5 rounded-lg border border-border/40 p-4 hover:border-primary/30 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider", CATEGORY_COLORS[t.category] || "bg-gray-500/20 text-gray-400")}>
                    {t.category}
                  </span>
                  <Badge variant="outline" className={cn("text-[9px]", AGENT_COLORS[t.agent])}>
                    <Bot className="size-2.5 mr-1" />{t.agent}
                  </Badge>
                  {t.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[9px]">#{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-muted-foreground font-mono">{t.use_count} uses</span>
                </div>
              </div>

              {/* Body */}
              <h3 className="text-sm font-semibold mb-1">{t.name}</h3>
              {t.description && (
                <p className="text-[10px] text-muted-foreground mb-2">{t.description}</p>
              )}
              <div className="text-[10px] text-muted-foreground/70 font-mono bg-accent/10 rounded p-2 mb-3 line-clamp-3">
                {t.content.slice(0, 200)}{t.content.length > 200 ? "..." : ""}
              </div>

              {/* Variables */}
              {t.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  <Variable className="size-3 text-muted-foreground" />
                  {t.variables.map(v => (
                    <Badge key={v.name} variant="outline" className="text-[8px] font-mono">
                      {v.name}{v.required ? " *" : ""}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button size="sm" className="text-[10px] h-7" onClick={() => openInstantiate(t)}>
                  <Play className="size-3 mr-1" /> Use
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-red-400"
                  onClick={() => handleDelete(t.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {/* Inline instantiate form */}
              {instantiateId === t.id && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  {t.variables.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {t.variables.map(v => (
                        <div key={v.name}>
                          <label className="text-[9px] font-semibold text-muted-foreground">
                            {v.label || v.name} {v.required ? '*' : ''}
                          </label>
                          <Input
                            value={instForm[v.name] || ""}
                            onChange={e => setInstForm(p => ({ ...p, [v.name]: e.target.value }))}
                            className="text-xs h-7"
                            placeholder={v.default || `Enter ${v.label || v.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {instError && <p className="text-[10px] text-red-400 mb-2">{instError}</p>}
                  {instResult && (
                    <p className="text-[10px] text-emerald-400 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Task created
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="text-[10px] h-7" onClick={() => handleInstantiate(t.id)}>
                      <Play className="size-3 mr-1" /> Create Task
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] h-7"
                      onClick={() => setInstantiateId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
        {sub && <div className="text-[9px] text-muted-foreground leading-tight">{sub}</div>}
      </div>
    </div>
  );
}
