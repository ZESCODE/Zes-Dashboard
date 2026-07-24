"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import TerminalIcon from "@/components/icons/terminal";
import Terminal from "@/components/terminal/terminal";

export default function TerminalPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Terminal",
        description: "Web-based terminal · virtual shell with multi-tab support",
        icon: TerminalIcon,
      }}
    >
      <div className="h-[calc(100vh-12rem)] min-h-[400px] rounded-xl overflow-hidden border border-border/20">
        <Terminal />
      </div>
    </DashboardPageLayout>
  );
}
