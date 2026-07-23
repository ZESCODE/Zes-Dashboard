"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import { MessageCircle } from "lucide-react";

export default function ClaudeChatPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Claude Chat",
        description: "Claude Code terminal bridge · :5905",
        icon: MessageCircle,
      }}
    >
      <ServiceCard
        url="http://localhost:5905"
        title="Claude Code Bridge"
        description="Claude Code terminal bridge. Connect to Claude Code sessions via HTTP with full terminal UI rendering."
        port={5905}
        icon={MessageCircle}
      />
    </DashboardPageLayout>
  );
}
