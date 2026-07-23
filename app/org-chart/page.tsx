"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import AtomIcon from "@/components/icons/atom";
import BuildingIcon from "@/components/icons/building";
import OrgChart, { OrgNode } from "@/components/dashboard/org-chart";

function buildOrgTree(agents: any[]): OrgNode[] {
  const agentMap = new Map<string, any>();
  for (const a of agents) {
    agentMap.set(a.id, { ...a, children: [] });
  }
  const roots: OrgNode[] = [];
  for (const a of agents) {
    const node = agentMap.get(a.id)!;
    if (a.reportsTo && agentMap.has(a.reportsTo)) {
      agentMap.get(a.reportsTo)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export default function OrgChartPage() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("company");
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [companyName, setCompanyName] = useState("Org Chart");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reassignMsg, setReassignMsg] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    try {
      let agents: any[] = [];

      if (companyId) {
        const res = await fetch(`/api/company/${companyId}`, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error("Company not found");
        const data = await res.json();
        agents = data.agents || [];
        setCompanyName(data.name || companyId);
      } else {
        const res = await fetch("/api/company/roster", { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        agents = data.agents || [];
        setCompanyName(data.company?.name || "ZES System");
      }

      const tree = buildOrgTree(agents);
      setNodes(tree);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchOrg();
    const iv = setInterval(fetchOrg, 15000);
    return () => clearInterval(iv);
  }, [fetchOrg]);

  const handleReassign = useCallback(async (agentId: string, newParentId: string | null) => {
    setReassignMsg(`Reassigning ${agentId}…`);
    try {
      const res = await fetch("/api/company/roster/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, newParentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setReassignMsg(`Failed: ${err.error}`);
        setTimeout(() => setReassignMsg(null), 3000);
        return;
      }
      const data = await res.json();
      const parentName = data.agent.reportsTo || "root";
      setReassignMsg(`✓ ${agentId} → ${parentName}`);
      setTimeout(() => setReassignMsg(null), 2000);
      // Refresh the org
      fetchOrg();
    } catch (e: any) {
      setReassignMsg(`Error: ${e.message}`);
      setTimeout(() => setReassignMsg(null), 3000);
    }
  }, [fetchOrg]);

  return (
    <DashboardPageLayout
      header={{
        title: companyName,
        description: nodes.length > 0
          ? `${nodes.length} root · ${nodes.reduce((s, n) => s + (n.children?.length || 0), 0)} direct reports · drag to reassign`
          : "Organization hierarchy",
        icon: companyId ? BuildingIcon : AtomIcon,
        actions: (
          <div className="flex items-center gap-2">
            {reassignMsg && (
              <Badge variant={reassignMsg.startsWith("✓") ? "secondary" : "outline"} className="text-[9px] transition-all">
                {reassignMsg.startsWith("✓") ? <CheckCircle2 className="size-2.5 mr-1 inline" /> : null}
                {reassignMsg}
              </Badge>
            )}
            {companyId && (
              <Badge variant="outline" className="text-[9px]">
                {nodes.reduce((sum, n) => sum + 1 + (n.children?.length || 0), 0)} AGENTS
              </Badge>
            )}
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={fetchOrg}>
              REFRESH
            </Button>
          </div>
        ),
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground animate-pulse">Loading org chart...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="size-8 text-warning" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchOrg}>RETRY</Button>
        </div>
      ) : (
        <div className="relative">
          {nodes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <BuildingIcon className="size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No agents to display</p>
              <p className="text-xs text-muted-foreground/70">Hire agents from the Laboratory page</p>
            </div>
          )}
          <OrgChart
            nodes={nodes}
            onReassign={handleReassign}
            onAgentClick={(id) => window.open(`/agents/${id}`, "_blank")}
          />
        </div>
      )}
    </DashboardPageLayout>
  );
}
