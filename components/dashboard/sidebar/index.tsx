"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import LayoutLeftIcon from "@/components/icons/layout";
import AtomIcon from "@/components/icons/atom";
import BracketsIcon from "@/components/icons/brackets";
import CuteRobotIcon from "@/components/icons/cute-robot";
import GearIcon from "@/components/icons/gear";
import TerminalIcon from "@/components/icons/terminal";
import MonkeyIcon from "@/components/icons/monkey";
import DotsVerticalIcon from "@/components/icons/dots-vertical";
import BuildingIcon from "@/components/icons/building";
import PlusIcon from "@/components/icons/plus";
import { Bullet } from "@/components/ui/bullet";
import LockIcon from "@/components/icons/lock";
import ShieldIcon from "@/components/icons/shield";
import GitBranchIcon from "@/components/icons/git-branch";
import CloudIcon from "@/components/icons/cloud";
import ActivityIcon from "@/components/icons/activity";
import CalendarIcon from "@/components/icons/calendar";
import BookTemplateIcon from "@/components/icons/template";
import Image from "next/image";
import { useIsV0 } from "@/lib/v0-context";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Sparkles, Target, DollarSign } from "lucide-react";

const STORAGE_KEY = "zes-dashboard-hidden-pages";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  isActive: boolean;
  locked?: boolean;
}

interface CompanyItem {
  id: string;
  name: string;
  isPrimary?: boolean;
}

// Static nav data
const data = {
  navMain: [
    {
      title: "Tools",
      items: [
        { title: "Overview", url: "/", icon: BracketsIcon, isActive: false } as NavItem,
        { title: "Laboratory", url: "/laboratory", icon: AtomIcon, isActive: false } as NavItem,
        { title: "Showcase", url: "/showcase", icon: Sparkles, isActive: false } as NavItem,
        { title: "Dashboard Config", url: "/dashboard-config", icon: GearIcon, isActive: false } as NavItem,
      ],
    },
    {
      title: "Company",
      items: [
        { title: "Board Room", url: "/company", icon: BuildingIcon, isActive: false } as NavItem,
        { title: "Org Chart", url: "/company/org-chart", icon: LayoutLeftIcon, isActive: false } as NavItem,
        { title: "Strategy", url: "/company/strategy", icon: Target, isActive: false } as NavItem,
        { title: "Budget", url: "/company/budget", icon: DollarSign, isActive: false } as NavItem,
        { title: "Hire Agent", url: "/company/hire", icon: PlusIcon, isActive: false } as NavItem,
      ],
    },
    {
      title: "Orchestration",
      items: [
        { title: "Orchestrator", url: "/orchestrator", icon: LayoutLeftIcon, isActive: false } as NavItem,
        { title: "Kanban", url: "/kanban", icon: LayoutLeftIcon, isActive: false } as NavItem,
        { title: "Tasks", url: "/tasks", icon: BracketsIcon, isActive: false } as NavItem,
        { title: "Reports", url: "/reports", icon: ShieldIcon, isActive: false } as NavItem,
        { title: "Skills", url: "/skills", icon: CuteRobotIcon, isActive: false } as NavItem,
        { title: "Memory Graph", url: "/memory-graph", icon: AtomIcon, isActive: false } as NavItem,
      ],
    },
    {
      title: "System",
      items: [
        { title: "Services", url: "/service", icon: BracketsIcon, isActive: false } as NavItem,
        { title: "System", url: "/system", icon: AtomIcon, isActive: false } as NavItem,
        { title: "Webhooks", url: "/webhooks", icon: GitBranchIcon, isActive: false } as NavItem,
        { title: "Cloud Sync", url: "/cloud", icon: CloudIcon, isActive: false } as NavItem,
        { title: "Activity", url: "/activity", icon: ActivityIcon, isActive: false } as NavItem,
        { title: "Scheduler", url: "/scheduler", icon: CalendarIcon, isActive: false } as NavItem,
        { title: "Templates", url: "/templates", icon: BookTemplateIcon, isActive: false } as NavItem,
        { title: "Terminal", url: "/terminal", icon: TerminalIcon, isActive: false } as NavItem,
        { title: "Memory Hub", url: "/memory", icon: CuteRobotIcon, isActive: false } as NavItem,
        { title: "Topology", url: "/topology", icon: LayoutLeftIcon, isActive: false } as NavItem,
        { title: "Processes", url: "/processes", icon: GearIcon, isActive: false } as NavItem,
        { title: "Network", url: "/network", icon: BracketsIcon, isActive: false } as NavItem,
        { title: "Workflows", url: "/workflows", icon: AtomIcon, isActive: false } as NavItem,
      ],
    },
    {
      title: "Agents",
      items: [
        { title: "Claude", url: "/claude", icon: CuteRobotIcon, isActive: false } as NavItem,
        { title: "Claude Code", url: "/claude-code", icon: BracketsIcon, isActive: false } as NavItem,
        { title: "Claude Chat", url: "/claude-chat", icon: AtomIcon, isActive: false } as NavItem,
        { title: "Hermes", url: "/hermes", icon: GearIcon, isActive: false } as NavItem,
        { title: "Hermes Chat", url: "/hermes-chat", icon: LayoutLeftIcon, isActive: false } as NavItem,
        { title: "9Router", url: "/9router", icon: AtomIcon, isActive: false } as NavItem,
        { title: "Teams", url: "/teams", icon: BracketsIcon, isActive: false } as NavItem,
        { title: "Codex Web", url: "/codex-web", icon: GearIcon, isActive: false } as NavItem,
      ],
    },
  ],
  desktop: {
    title: "Desktop (Online)",
    status: "online",
  },
  user: {
    name: "KRIMSON",
    email: "krimson@joyco.studio",
    avatar: "/avatars/user_krimson.png",
  },
};

/* ────────────── New Company Dialog ────────────── */

function NewCompanyDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budgetDollars, setBudgetDollars] = useState("5000");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          budget_cents: parseInt(budgetDollars) * 100 || 500000,
        }),
      });
      const data = await res.json();
      if (data.companyId) {
        onCreated(data.companyId);
        onClose();
      }
    } catch (e) {
      console.error("Failed to create company", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background border border-border/40 rounded-xl p-6 w-[400px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-display font-bold mb-4 flex items-center gap-2">
          <PlusIcon className="size-4 text-primary" />
          New Company
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Company Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Alpha"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this team works on..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Monthly Budget (USD)</label>
            <input
              value={budgetDollars}
              onChange={(e) => setBudgetDollars(e.target.value)}
              placeholder="5000"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">Creates a new company group with 3 default agents (Lead, Assistant, Specialist).</p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={onClose} className="h-8 px-3 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="h-8 px-4 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Company"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────── Sidebar ────────────── */

export function DashboardSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const isV0 = useIsV0();
  const [hiddenPages, setHiddenPages] = useState<string[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [showNewCompany, setShowNewCompany] = useState(false);

  // Load companies and hidden pages
  const loadData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHiddenPages(JSON.parse(stored) as string[]);
    } catch {}
    // Fetch companies
    fetch("/api/company")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const list: CompanyItem[] = [];
        if (data.primary) list.push(data.primary);
        if (data.companies) list.push(...data.companies);
        setCompanies(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("storage", handler);
    const iv = setInterval(handler, 5000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(iv);
    };
  }, []);

  // Filter nav items based on config
  const filteredNav = data.navMain.map((group) => ({
    ...group,
    items: group.items.filter((item) => !hiddenPages.includes(item.url)),
  })).filter((group) => group.items.length > 0);

  const handleCompanyCreated = (id: string) => {
    loadData();
    // Navigate to new company
    window.location.href = `/company/${id}`;
  };

  return (
    <>
      <Sidebar {...props} className={cn("py-sides overflow-y-auto", className)}>
              

        {/* Brand header */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border/10">
          <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[5px] p-[2.5px]">
            <div className="bg-black rounded-[2px] w-7 h-7 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">Z</span>
            </div>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="text-base font-bold tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">ZES</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Orchestration System</span>
          </div>
        </div>

        <SidebarContent>
          {/* Companies Section (dynamic) */}
          {companies.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>
                <Bullet className="mr-2" />
                Companies
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {companies.map((company) => (
                    <SidebarMenuItem key={company.id}>
                      <SidebarMenuButton asChild isActive={false}>
                        <a href={`/company/${company.id}`}>
                          <BuildingIcon className="size-5" />
                          <span className="truncate">{company.name}</span>
                          {company.isPrimary && (
                            <span className="text-[8px] uppercase text-muted-foreground ml-auto">PRIMARY</span>
                          )}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {/* "+ New Company" link */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild={false}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewCompany(true)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="size-5 rounded-md border border-dashed border-muted-foreground/40 flex items-center justify-center">
                          <PlusIcon className="size-3" />
                        </div>
                        <span className="text-[11px]">New Company</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {filteredNav.map((group, i) => (
            <SidebarGroup
              className={cn(i === 0 && companies.length === 0 && "rounded-t-none")}
              key={group.title}
            >
              <SidebarGroupLabel>
                <Bullet className="mr-2" />
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem
                      key={item.title}
                      className={cn(
                        item.locked && "pointer-events-none opacity-50",
                        isV0 && "pointer-events-none"
                      )}
                      data-disabled={item.locked}
                    >
                      <SidebarMenuButton
                        asChild={!item.locked}
                        isActive={item.isActive}
                        disabled={item.locked}
                        className={cn(
                          "disabled:cursor-not-allowed",
                          item.locked && "pointer-events-none"
                        )}
                      >
                        {item.locked ? (
                          <div className="flex items-center gap-3 w-full">
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </div>
                        ) : (
                          <a href={item.url}>
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </a>
                        )}
                      </SidebarMenuButton>
                      {item.locked && (
                        <SidebarMenuBadge>
                          <LockIcon className="size-5 block" />
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-0">
          <SidebarGroup>
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              User
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Popover>
                    <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
                      <div className="shrink-0 flex size-14 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground overflow-clip">
                        <Image
                          src={data.user.avatar}
                          alt={data.user.name}
                          width={120}
                          height={120}
                        />
                      </div>
                      <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate text-xl font-display">
                            {data.user.name}
                          </span>
                          <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100">
                            {data.user.email}
                          </span>
                        </div>
                        <DotsVerticalIcon className="ml-auto size-4" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-0"
                      side="bottom"
                      align="end"
                      sideOffset={4}
                    >
                      <div className="flex flex-col">
                        <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                          <MonkeyIcon className="mr-2 h-4 w-4" />
                          Account
                        </button>
                        <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                          <GearIcon className="mr-2 h-4 w-4" />
                          Settings
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>

        {/* Theme Toggle */}
        <div className="px-4 py-2 border-t border-border/20">
          <ThemeToggle />
        </div>

        <SidebarRail />
      </Sidebar>

      {/* New Company Dialog */}
      {showNewCompany && (
        <NewCompanyDialog
          onClose={() => setShowNewCompany(false)}
          onCreated={handleCompanyCreated}
        />
      )}
    </>
  );
}
