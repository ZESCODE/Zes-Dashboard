"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Columns, MessageSquare, Bot, GitBranch, Server, Activity, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryItems = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: Server, label: "Services", href: "/service" },
  { icon: Columns, label: "Tasks", href: "/tasks" },
  { icon: Activity, label: "Activity", href: "/activity" },
  { icon: Bot, label: "Templates", href: "/templates" },
  { icon: Cpu, label: "Scheduler", href: "/scheduler" },
];

const quickAccessItems = [
  { icon: GitBranch, label: "Memory", href: "/memory" },
  { icon: MessageSquare, label: "Companies", href: "/company" },
  { icon: GitBranch, label: "Pipeline", href: "/company/media-agency/pipeline" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(100,116,139,0.15)] bg-[rgba(2,6,23,0.92)] backdrop-blur-[16px] safe-area-bottom md:hidden">
      <div className="flex justify-around items-center h-14 px-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-0 shrink-0 min-h-[44px]",
                isActive ? "text-[#818cf8]" : "text-[#64748b] hover:text-[#94a3b8]"
              )}>
              <div className={cn("p-1 rounded-lg transition-all", isActive && "bg-[rgba(99,102,241,0.1)]")}>
                <Icon className={cn("h-4 w-4", isActive && "drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]")} />
              </div>
              <span className={cn("text-[8px] font-medium", isActive ? "text-[#818cf8]" : "text-[#64748b]")}>{item.label}</span>
            </Link>
          );
        })}
        {/* Overflow menu for quick-access */}
        <div className="relative group">
          <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg min-h-[44px] cursor-pointer text-[#64748b]">
            <div className="p-1 rounded-lg">
              <span className="text-lg font-bold leading-none">⋯</span>
            </div>
            <span className="text-[8px] font-medium text-[#64748b]">More</span>
          </div>
          <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block group-active:block">
            <div className="bg-[rgba(2,6,23,0.95)] backdrop-blur-[16px] border border-[rgba(100,116,139,0.15)] rounded-lg p-1 shadow-xl min-w-[120px]">
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all",
                      isActive ? "text-[#818cf8] bg-[rgba(99,102,241,0.1)]" : "text-[#64748b] hover:text-[#94a3b8]"
                    )}>
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
