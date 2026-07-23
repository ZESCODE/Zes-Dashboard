"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Settings2, Eye, EyeOff, Monitor, GripVertical, ArrowUpDown, RefreshCw,
} from "lucide-react";
import GearIcon from "@/components/icons/gear";

interface PageEntry {
  id: string;
  label: string;
  category: string;
  visible: boolean;
}

const ALL_PAGES: PageEntry[] = [
  { id: "/", label: "Overview", category: "Tools", visible: true },
  { id: "/orchestrator", label: "Orchestrator", category: "Orchestration", visible: true },
  { id: "/kanban", label: "Kanban", category: "Orchestration", visible: true },
  { id: "/tasks", label: "Tasks", category: "Orchestration", visible: true },
  { id: "/skills", label: "Skills", category: "Orchestration", visible: true },
  { id: "/memory-graph", label: "Memory Graph", category: "Orchestration", visible: true },
  { id: "/service", label: "Services", category: "System", visible: true },
  { id: "/system", label: "System", category: "System", visible: true },
  { id: "/memory", label: "Memory Hub", category: "System", visible: true },
  { id: "/topology", label: "Topology", category: "System", visible: true },
  { id: "/processes", label: "Processes", category: "System", visible: true },
  { id: "/network", label: "Network", category: "System", visible: true },
  { id: "/laboratory", label: "Laboratory", category: "Tools", visible: true },
  { id: "/claude", label: "Claude", category: "Agents", visible: true },
  { id: "/claude-code", label: "Claude Code", category: "Agents", visible: true },
  { id: "/hermes", label: "Hermes", category: "Agents", visible: true },
  { id: "/hermes-chat", label: "Hermes Chat", category: "Agents", visible: true },
  { id: "/9router", label: "9Router", category: "Agents", visible: true },
  { id: "/teams", label: "Teams", category: "Agents", visible: true },
  { id: "/codex-web", label: "Codex Web", category: "Agents", visible: true },
  { id: "/workflows", label: "Workflows", category: "System", visible: true },
];

const STORAGE_KEY = "zes-dashboard-hidden-pages";

export default function DashboardConfigPage() {
  const [pages, setPages] = useState<PageEntry[]>(ALL_PAGES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const hidden = JSON.parse(stored) as string[];
        setPages((prev) =>
          prev.map((p) => ({ ...p, visible: !hidden.includes(p.id) }))
        );
      }
    } catch {}
  }, []);

  const toggleVisibility = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p))
    );
    setSaved(false);
  };

  const saveConfig = () => {
    const hidden = pages.filter((p) => !p.visible).map((p) => p.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetConfig = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPages(ALL_PAGES);
    setSaved(true);
  };

  const visibleCount = pages.filter((p) => p.visible).length;
  const hiddenCount = pages.filter((p) => !p.visible).length;
  const categories = [...new Set(pages.map((p) => p.category))];

  return (
    <DashboardPageLayout
      header={{
        title: "Dashboard Config",
        description: `${visibleCount} visible · ${hiddenCount} hidden · click to toggle`,
        icon: GearIcon,
      }}
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-accent/20 rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pages</div>
          <div className="text-lg font-display font-bold">{pages.length}</div>
        </div>
        <div className="bg-accent/20 rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Visible</div>
          <div className="text-lg font-display font-bold text-emerald-400">{visibleCount}</div>
        </div>
        <div className="bg-accent/20 rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Hidden</div>
          <div className="text-lg font-display font-bold text-muted-foreground">{hiddenCount}</div>
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat) => {
        const catPages = pages.filter((p) => p.category === cat);
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</span>
              <span className="text-[10px] font-mono text-muted-foreground/50">
                {catPages.filter((p) => p.visible).length}/{catPages.length}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {catPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => toggleVisibility(page.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition-all text-left",
                    page.visible
                      ? "border-border/30 bg-accent/10 hover:border-primary/40 hover:bg-accent/20"
                      : "border-dashed border-muted-foreground/20 bg-transparent opacity-50 hover:opacity-80"
                  )}
                >
                  {page.visible ? (
                    <Eye className="size-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <EyeOff className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn(page.visible ? "text-foreground" : "text-muted-foreground line-through")}>
                    {page.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/30">
        <Button onClick={saveConfig} variant="default" size="sm" className="gap-1.5">
          <Settings2 className="size-3.5" />
          {saved ? "Saved!" : "Save Configuration"}
        </Button>
        <Button onClick={resetConfig} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Reset to Default
        </Button>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
          Stored in localStorage · persists across sessions
        </span>
      </div>
    </DashboardPageLayout>
  );
}
