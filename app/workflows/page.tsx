"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import { GitBranch } from "lucide-react";

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
    </DashboardPageLayout>
  );
}
