"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search, BookOpen, Code, Globe, Palette, Brain, Zap, Shield, Cpu, X, FileText,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import CuteRobotIcon from "@/components/icons/cute-robot";

interface Skill {
  name: string;
  category: string;
  description: string;
  content?: string;
  origin?: string;
  path?: string;
  version?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  "ZES": BookOpen,
  "UI/UX": Palette,
  "System": Cpu,
  "Memory": Brain,
  "Integration": Globe,
  "Agent": Zap,
  "Security": Shield,
  "Code": Code,
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filtered, setFiltered] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5002/api/skills");
        if (res.ok) {
          const data = await res.json();
          const list = data.skills || data || [];
          setSkills(list);
          setFiltered(list);
        }
      } catch {
        // Use hardcoded fallback
        setSkills(fallbackSkills);
        setFiltered(fallbackSkills);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = skills;
    if (category !== "all") {
      result = result.filter((s) => s.category === category);
    }
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, category, skills]);

  const categories = ["all", ...new Set(skills.map((s) => s.category).filter(Boolean))];

  return (
    <DashboardPageLayout
      header={{
        title: "Skills",
        description: `${skills.length} installed · ${filtered.length} shown · ${categories.length - 1} categories`,
        icon: CuteRobotIcon,
      }}
    >
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat === "all" ? null : categoryIcons[cat] || Code;
            const count = cat === "all" ? skills.length : skills.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-2.5 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1",
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/20 text-muted-foreground hover:bg-accent/40"
                )}
              >
                {Icon && <Icon className="size-3" />}
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground flex items-center justify-center gap-2">
          <div className="size-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading skills from API...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Skill List */}
          <div className={cn("space-y-1.5", selected ? "lg:col-span-1" : "lg:col-span-3")}>
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No skills match "{search}"
              </div>
            ) : (
              filtered.map((skill) => {
                const Icon = categoryIcons[skill.category] || Code;
                return (
                  <button
                    key={skill.name}
                    onClick={() => {
                      setSelected(skill);
                      setExpanded(false);
                    }}
                    className={cn(
                      "w-full text-left rounded-lg p-3 border transition-all",
                      selected?.name === skill.name
                        ? "border-primary bg-primary/5"
                        : "border-border/30 bg-accent/5 hover:bg-accent/10 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold truncate">{skill.name}</span>
                      <Badge variant="outline" className="ml-auto text-[9px] shrink-0">
                        {skill.category}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{skill.description}</p>
                    {skill.version && (
                      <span className="text-[8px] text-muted-foreground/50 font-mono mt-1 block">
                        v{skill.version} · {skill.origin || "installed"}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border/40 bg-card">
                <div className="flex items-center justify-between p-4 border-b border-border/20">
                  <div className="flex items-center gap-2">
                    {React.createElement(categoryIcons[selected.category] || Code, { className: "size-4 text-muted-foreground" })}
                    <span className="text-sm font-bold">{selected.name}</span>
                    <Badge variant="outline" className="text-[9px]">{selected.category}</Badge>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground font-mono">
                    <span>{selected.origin || "installed"}</span>
                    {selected.version && <span>v{selected.version}</span>}
                    {selected.path && (
                      <span className="truncate max-w-[300px]" title={selected.path}>
                        {selected.path}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed mb-4">{selected.description}</p>

                  {selected.content && (
                    <div>
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 hover:text-foreground transition-colors"
                      >
                        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        <FileText className="size-3" />
                        Skill Content ({selected.content.length} chars)
                      </button>
                      {expanded && (
                        <pre className="text-[10px] leading-relaxed text-muted-foreground bg-accent/20 rounded-lg p-3 whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto border border-border/20">
                          {selected.content.slice(0, 5000)}
                          {selected.content.length > 5000 && (
                            <span className="block text-center text-[9px] text-muted-foreground mt-2">
                              ... {selected.content.length - 5000} more chars
                            </span>
                          )}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardPageLayout>
  );
}

const fallbackSkills: Skill[] = [
  { name: "ZES-ui-language", category: "UI/UX", description: "Unified UI/UX language for ZES — master skill combining shadcn, Polybot theme tokens, and M.O.N.K.Y OS design system.", version: "1.0.0", origin: "ZES" },
  { name: "frontend-design", category: "UI/UX", description: "Frontend design principles and patterns for ZES dashboard interfaces.", origin: "Anthropic" },
  { name: "web-artifacts-builder", category: "UI/UX", description: "Build and deploy web artifacts for ZES dashboard and tools.", origin: "Anthropic" },
  { name: "theme-factory", category: "UI/UX", description: "Theme generation and customization for shadcn-based interfaces.", origin: "Anthropic" },
  { name: "skill-creator", category: "System", description: "Create and manage Codex skills for ZES ecosystem.", origin: "Anthropic" },
  { name: "mcp-builder", category: "System", description: "Build MCP servers for agent tool integration.", origin: "Anthropic" },
  { name: "memory-files-rag", category: "Memory", description: "RAG-based memory management with file embeddings.", origin: "ux-ui-mastery" },
  { name: "decision-maker", category: "Agent", description: "Structured decision-making framework for agent workflows.", origin: "ux-ui-mastery" },
  { name: "prompt-compressor", category: "Agent", description: "Compress prompts while preserving intent for LLM efficiency.", origin: "LibreUIUX" },
  { name: "9router-integration", category: "Integration", description: "Use when working with 9Router AI gateway — LLM chat/code generation, vector embeddings, web search, URL fetching.", origin: "ECC" },
  { name: "ZES-9router", category: "ZES", description: "9Router AI Gateway management — model routing, API key management, provider configuration.", version: "1.0.0", origin: "ZES" },
  { name: "SELF-INSTALL", category: "ZES", description: "ZES system self-installation and bootstrapping skill.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-skill-commander", category: "ZES", description: "Skill management and orchestration for ZES ecosystem.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-design", category: "ZES", description: "ZES design system and UI component library.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-memory", category: "Memory", description: "ZES memory hub management — read, write, search across all agent memories.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-system", category: "System", description: "ZES system management — services, processes, and configuration.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-hermes", category: "Agent", description: "Hermes agent orchestration and memory stewardship.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-codex", category: "Code", description: "Codex CLI integration and workflow automation.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-remote", category: "Integration", description: "Remote connection and tunnel management for ZES.", version: "1.0.0", origin: "ZES" },
  { name: "ZES-claude", category: "Agent", description: "Claude agent integration and communication tools.", version: "1.0.0", origin: "ZES" },
];
