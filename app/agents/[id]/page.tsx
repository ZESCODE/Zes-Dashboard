"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  User, Briefcase, DollarSign, Activity, Clock, Target,
  AlertTriangle, ArrowLeft,
} from "lucide-react";
import CuteRobotIcon from "@/components/icons/cute-robot";
import Link from "next/link";

interface Agent {
  id: string; name: string; role: string; title: string;
  description: string; status: string; reportsTo: string | null;
  budgetMonthlyCents: number; spentMonthCents: number;
  lastHeartbeat: string; capabilities: string[];
  adapterType: string;
}

interface AgentTask {
  id: string; title: string; status: string; priority: number;
  created_at: string;
}

const statusColor: Record<string, string> = {
  running: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  active: "text-success bg-success/10 border-success/30",
  paused: "text-warning bg-warning/10 border-warning/30",
  planned: "text-muted-foreground bg-muted/30 border-muted",
  error: "text-destructive bg-destructive/10 border-destructive/30",
  terminated: "text-destructive bg-destructive/10 border-destructive/30",
};

const roleBadge: Record<string, string> = {
  ceo: "bg-purple-500/20 text-purple-400",
  engineer: "bg-blue-500/20 text-blue-400",
  communicator: "bg-cyan-500/20 text-cyan-400",
  infrastructure: "bg-amber-500/20 text-amber-400",
};

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [company, setCompany] = useState<{ id: string; name: string; isPrimary?: boolean } | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/agents/${agentId}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(res.status === 404 ? "Agent not found" : "Failed to load");
      const data = await res.json();
      setAgent(data.agent);
      setCompany(data.company);
      setTasks(data.tasks || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 15000); return () => clearInterval(iv); }, [fetchData]);

  const budgetUtil = agent ? (agent.spentMonthCents / agent.budgetMonthlyCents) * 100 : 0;
  const going = agent?.lastHeartbeat
    ? Math.floor((Date.now() - new Date(agent.lastHeartbeat).getTime()) / 60000)
    : null;

  return (
    <DashboardPageLayout
      header={{
        title: agent?.name || "Agent",
        description: agent ? `${agent.title || agent.role} · ${company?.name || "Unknown company"}` : "Loading...",
        icon: CuteRobotIcon,
        actions: (
          <div className="flex items-center gap-2">
            {company && (
              <Link href={`/company/${company.id}`}>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                  <ArrowLeft className="size-3 mr-1" /> {company.name}
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={fetchData}>
              REFRESH
            </Button>
          </div>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading agent...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>RETRY</Button>
        </div>
      ) : agent ? (
        <>
          {/* Profile Header */}
          <div className="bg-accent/15 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-display font-bold">{agent.name}</h2>
                  <Badge variant="outline" className={cn("text-[9px]", statusColor[agent.status] || "")}>
                    {agent.status}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[9px]", roleBadge[agent.role] || "bg-muted")}>
                    {agent.title || agent.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{agent.description || "No description"}</p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Briefcase className="size-3" /> {agent.role}</span>
                  <span className="flex items-center gap-1"><Activity className="size-3" /> {agent.adapterType}</span>
                  {going !== null && (
                    <span className={cn("flex items-center gap-1", going > 10 ? "text-warning" : "text-success")}>
                      <Clock className="size-3" /> {going < 1 ? "Just now" : `${going}m ago`}
                    </span>
                  )}
                  {agent.reportsTo && (
                    <span className="flex items-center gap-1">
                      Reports to: <Link href={`/agents/${agent.reportsTo}`} className="text-primary hover:underline">{agent.reportsTo}</Link>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <DashboardStat label="MONTHLY BUDGET" value={`$${(agent.budgetMonthlyCents / 100).toLocaleString()}`} description="ALLOCATED" icon={DollarSign} intent="positive" direction="up" />
            <DashboardStat label="SPENT" value={`$${(agent.spentMonthCents / 100).toLocaleString()}`} description="THIS MONTH" icon={Activity} intent={budgetUtil > 80 ? "negative" : "positive"} direction={budgetUtil > 50 ? "up" : "down"} />
            <DashboardStat label="UTILIZATION" value={`${budgetUtil.toFixed(1)}%`} description="BUDGET USED" icon={Target} intent={budgetUtil > 80 ? "negative" : budgetUtil > 50 ? "warning" : "positive"} direction={budgetUtil > 50 ? "up" : "down"} />
            <DashboardStat label="TASKS" value={String(tasks.length)} description="ASSIGNED" icon={Briefcase} intent={tasks.length > 0 ? "positive" : "negative"} direction={tasks.length > 0 ? "up" : "down"} />
          </div>

          {/* Capabilities + Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <DashboardCard title="CAPABILITIES">
              {agent.capabilities && agent.capabilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-[10px]">
                      {cap}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No capabilities listed</p>
              )}
            </DashboardCard>

            <DashboardCard title="RECENT TASKS">
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between bg-accent/20 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          "size-1.5 rounded-full shrink-0",
                          task.status === "done" ? "bg-success" :
                          task.status === "running" ? "bg-primary" :
                          task.status === "failed" ? "bg-destructive" : "bg-muted-foreground"
                        )} />
                        <span className="text-xs truncate">{task.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[8px] shrink-0 ml-2">
                        P{task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No tasks assigned</p>
              )}
            </DashboardCard>
          </div>

          {/* Raw Data */}
          <DashboardCard title="AGENT DATA">
            <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto">
              {JSON.stringify(agent, null, 2)}
            </pre>
          </DashboardCard>
        </>
      ) : null}
    </DashboardPageLayout>
  );
}
