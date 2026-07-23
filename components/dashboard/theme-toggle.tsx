"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-8 w-full rounded-md bg-muted/30 animate-pulse", className)} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-all",
        "hover:bg-accent hover:text-accent-foreground",
        "group",
        className,
      )}
    >
      <div className={cn(
        "size-6 rounded-md flex items-center justify-center transition-all",
        isDark ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/20 text-indigo-400",
      )}>
        {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </div>
      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
      <span className="ml-auto text-[9px] text-muted-foreground/50 uppercase">
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
