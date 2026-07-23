"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import TerminalIcon from "@/components/icons/terminal";

export default function TerminalPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Terminal",
        description: "Web-based terminal · :7173",
        icon: TerminalIcon,
      }}
    >
      <ServiceCard
        url="http://localhost:7173"
        title="Web Terminal"
        description="Browser-based terminal access to the ZES environment. Full shell access with command history, tabs, and session persistence."
        port={7173}
        icon={TerminalIcon}
      />
    </DashboardPageLayout>
  );
}
