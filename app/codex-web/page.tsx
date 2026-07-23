"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import { Terminal } from "lucide-react";

export default function CodexWebPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Codex Web",
        description: "Codex CLI web interface · :5900",
        icon: Terminal,
      }}
    >
      <ServiceCard
        url="http://localhost:5900/apps/z3c0d3x-chat/index.html"
        title="Codex Web UI"
        description="Codex CLI web interface. Chat with Codex, browse skills, manage MCP servers, and view agent memory in a browser."
        port={5900}
        icon={Terminal}
      />
    </DashboardPageLayout>
  );
}
