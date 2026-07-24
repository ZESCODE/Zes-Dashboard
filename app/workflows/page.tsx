"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import { GitBranch } from "lucide-react";
import WiringDiagram from "@/components/wireflow/wiring-diagram";

export default function WorkflowsPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Workflows",
        description: "ZES workflow engine · :5050",
        icon: GitBranch,
      }}
    >
      <ServiceCard
        url="http://localhost:5050/workflows"
        title="Workflow Engine"
        description="ZES workflow automation. Design, execute, and monitor multi-step workflows across all agents and services."
        port={5050}
        icon={GitBranch}
      />

      {/* ── Workflow Pipeline Diagram ── */}
      <details className="group mt-8">
        <summary className="cursor-pointer text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 mb-4">
          <span className="inline-block size-1.5 rounded-full bg-primary/60" />
          Workflow Pipeline
          <span className="text-[10px] text-muted-foreground/50 font-mono">click to expand</span>
        </summary>
        <div className="rounded-xl border border-border overflow-hidden" style={{ height: 500 }}>
          <WiringDiagram />
        </div>
      </details>

    </DashboardPageLayout>
  );
}
