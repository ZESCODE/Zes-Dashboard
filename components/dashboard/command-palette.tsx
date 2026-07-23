"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search, Home, Code, Building2, Activity, Calendar, BookTemplate,
  GitBranch, FileText, Users, Server, Cloud, Terminal, MessageSquare,
  MemoryStick, ArrowRight, Plus, Zap, Sparkles,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pagesData, setPagesData] = useState<{ path: string }[]>([]);

  // Fetch dynamic data (companies, etc.) for commands
  useEffect(() => {
    if (!open) { setQuery(""); return; }
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);
    // Fetch companies for quick navigation
    fetch("/api/company?path=list").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setPagesData(d.map((c: any) => ({ path: c.id })));
    }).catch(() => {});
  }, [open]);

  const commands: Command[] = [
    // Navigation
    { id: "nav-home", label: "Dashboard Home", description: "Go to main overview", category: "Navigation", icon: Home, action: () => { router.push("/"); onClose(); } },
    { id: "nav-company", label: "Board Room", description: "View all companies", category: "Navigation", icon: Building2, action: () => { router.push("/company"); onClose(); } },
    { id: "nav-tasks", label: "Task Board", description: "View and manage tasks", category: "Navigation", icon: Code, action: () => { router.push("/tasks"); onClose(); } },
    { id: "nav-orchestrator", label: "Orchestrator", description: "Agent task orchestration", category: "Navigation", icon: GitBranch, action: () => { router.push("/orchestrator"); onClose(); } },
    { id: "nav-activity", label: "Activity Feed", description: "Live agent activity events", category: "Navigation", icon: Activity, action: () => { router.push("/activity"); onClose(); } },
    { id: "nav-scheduler", label: "Scheduler", description: "Scheduled agent tasks", category: "Navigation", icon: Calendar, action: () => { router.push("/scheduler"); onClose(); } },
    { id: "nav-templates", label: "Task Templates", description: "Reusable task blueprints", category: "Navigation", icon: BookTemplate, action: () => { router.push("/templates"); onClose(); } },
    { id: "nav-memory", label: "Memory Hub", description: "Browse memory facts and entities", category: "Navigation", icon: MemoryStick, action: () => { router.push("/memory"); onClose(); } },
    { id: "nav-memory-graph", label: "Memory Graph", description: "Visual knowledge graph", category: "Navigation", icon: FileText, action: () => { router.push("/memory-graph"); onClose(); } },
    { id: "nav-org-chart", label: "Org Chart", description: "Organizational chart", category: "Navigation", icon: Users, action: () => { router.push("/org-chart"); onClose(); } },
    { id: "nav-webhooks", label: "Webhooks", description: "GitHub webhook receiver", category: "Navigation", icon: Server, action: () => { router.push("/webhooks"); onClose(); } },
    { id: "nav-cloud", label: "Cloud Sync", description: "Backup and restore", category: "Navigation", icon: Cloud, action: () => { router.push("/cloud"); onClose(); } },
    { id: "nav-agents", label: "Agent Lab", description: "Browse and hire agents", category: "Navigation", icon: Users, action: () => { router.push("/laboratory"); onClose(); } },

    // Quick Actions
    { id: "action-new-task", label: "Create New Task", description: "Add a task to the system", category: "Actions", icon: Plus, action: () => { router.push("/orchestrator"); onClose(); } },
    { id: "action-new-template", label: "Create Template", description: "Create a task template", category: "Actions", icon: BookTemplate, action: () => { router.push("/templates"); onClose(); } },
    { id: "action-new-company", label: "New Company", description: "Create a new company", category: "Actions", icon: Building2, action: () => { router.push("/company"); onClose(); } },
    { id: "action-new-schedule", label: "Schedule Task", description: "Add a scheduled agent task", category: "Actions", icon: Calendar, action: () => { router.push("/scheduler"); onClose(); } },

    // Info
    { id: "info-system-health", label: "System Health", description: "Check all system statuses", category: "Info", icon: Zap, action: () => { router.push("/"); onClose(); } },
    { id: "info-memory-stats", label: "Memory Stats", description: "View memory hub statistics", category: "Info", icon: MemoryStick, action: () => { router.push("/memory"); onClose(); } },
  ];

  // Dynamic company pages
  pagesData.forEach(c => {
    if (c.path) {
      commands.push({
        id: `company-${c.path}`,
        label: `Company: ${c.path}`,
        description: "View company details and pipeline",
        category: "Companies",
        icon: Building2,
        action: () => { router.push(`/company/${c.path}`); onClose(); },
      });
    }
  });

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Reset selection when filter changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  // Group filtered results by category
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
    return acc;
  }, {});

  let globalIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pointer-events-none">
        <div
          className="w-full max-w-lg bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search pages, actions, companies..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <kbd className="text-[9px] text-muted-foreground/50 bg-accent/30 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {Object.entries(grouped).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                <Search className="size-6 mx-auto mb-2 opacity-30" />
                No results for &quot;{query}&quot;
              </div>
            ) : (
              Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                    {category}
                  </div>
                  {cmds.map(cmd => {
                    const idx = globalIdx++;
                    const selected = idx === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          selected ? "bg-accent/30" : "hover:bg-accent/10"
                        )}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={cmd.action}
                      >
                        <cmd.icon className={cn(
                          "size-4 shrink-0",
                          cmd.category === "Navigation" ? "text-blue-400" :
                          cmd.category === "Actions" ? "text-amber-400" :
                          cmd.category === "Companies" ? "text-emerald-400" :
                          "text-purple-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{cmd.description}</div>
                        </div>
                        <ArrowRight className={cn(
                          "size-3 text-muted-foreground/30 transition-opacity",
                          selected ? "opacity-100" : "opacity-0"
                        )} />
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border/20 text-[9px] text-muted-foreground/50">
            <span><kbd className="font-mono bg-accent/20 rounded px-1">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-accent/20 rounded px-1">↵</kbd> Open</span>
            <span><kbd className="font-mono bg-accent/20 rounded px-1">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </>
  );
}
