"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import { Users } from "lucide-react";

export default function TeamsPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Teams",
        description: "Agent control plane · :8822",
        icon: Users,
      }}
    >
      <ServiceCard
        url="http://localhost:8822"
        title="amux — Teams Control Plane"
        description="amux multi-agent orchestration. Manage parallel agent sessions across Codex, Claude, and Hermes with self-healing watchdogs."
        port={8822}
        icon={Users}
      />
    </DashboardPageLayout>
  );
}
