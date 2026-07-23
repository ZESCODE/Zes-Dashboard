"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Cpu, HardDrive, Activity, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ProcessorIcon from "@/components/icons/proccesor";

interface Process {
  pid: string;
  cmd: string;
  cpu: string;
  mem: string;
}

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"cpu" | "mem" | "pid">("cpu");

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5002/api/processes");
      if (res.ok) {
        const data = await res.json();
        setProcesses(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = processes
    .filter((p) => p.cmd.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => parseFloat(b[sortBy]) - parseFloat(a[sortBy]));

  const totalCpu = processes.reduce((s, p) => s + parseFloat(p.cpu || "0"), 0).toFixed(1);
  const totalMem = processes.reduce((s, p) => s + parseFloat(p.mem || "0"), 0).toFixed(1);

  return (
    <DashboardPageLayout
      header={{
        title: "Processes",
        description: "Real-time process monitor",
        icon: ProcessorIcon,
      }}
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Processes", value: processes.length.toString(), icon: Activity, color: "text-blue-400" },
          { label: "Total CPU", value: `${totalCpu}%`, icon: Cpu, color: "text-emerald-400" },
          { label: "Total Mem", value: `${totalMem}%`, icon: HardDrive, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-accent/20 rounded-lg p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.color)} />
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-lg font-display font-bold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Controls */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search processes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["cpu", "mem", "pid"] as const).map((s) => (
            <Button
              key={s}
              variant={sortBy === s ? "default" : "ghost"}
              size="sm"
              className="text-xs"
              onClick={() => setSortBy(s)}
            >
              {s.toUpperCase()}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={fetchProcesses}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Process List */}
      <DashboardCard title="PROCESS TABLE" intent="default">
        {loading && processes.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading processes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No processes found</div>
        ) : (
          <div className="space-y-0.5">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              <span className="w-12 text-right shrink-0">CPU%</span>
              <span className="w-12 text-right shrink-0">MEM%</span>
              <span className="w-14 shrink-0">PID</span>
              <span className="flex-1">Command</span>
              <span className="w-10 shrink-0"></span>
            </div>
            {/* Rows */}
            {filtered.slice(0, 100).map((p, i) => (
              <div
                key={p.pid || i}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded hover:bg-accent/20 transition-colors",
                  parseFloat(p.cpu) > 5 ? "bg-destructive/5" : ""
                )}
              >
                <span className={cn(
                  "w-12 text-right shrink-0",
                  parseFloat(p.cpu) > 5 ? "text-destructive font-bold" : "text-muted-foreground"
                )}>
                  {p.cpu}%
                </span>
                <span className="w-12 text-right shrink-0 text-muted-foreground">{p.mem}%</span>
                <span className="w-14 shrink-0 text-muted-foreground/60">{p.pid}</span>
                <span className="flex-1 truncate text-foreground/80">{p.cmd}</span>
                <span className="w-10 shrink-0 flex justify-end">
                  <button
                    onClick={async () => {
                      if (confirm(`Kill process ${p.pid} (${p.cmd.slice(0, 30)})?`)) {
                        try {
                          await fetch(`http://127.0.0.1:5002/api/processes/${p.pid}/kill`, { method: "POST" });
                          fetchProcesses();
                        } catch {}
                      }
                    }}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5"
                    title="Kill process"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    </DashboardPageLayout>
  );
}
