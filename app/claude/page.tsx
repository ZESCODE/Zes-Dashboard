"use client";

import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import CuteRobotIcon from "@/components/icons/cute-robot";

export default function ClaudePage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Claude",
        description: "Claude AI agent interfaces",
        icon: CuteRobotIcon,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ServiceCard
          url="/claude-bridge.html"
          title="Claude Chat"
          description="Claude Code chat interface via HTTP bridge. Full terminal UI with session management and input handling."
          port={8788}
          icon={CuteRobotIcon}
        />
        <ServiceCard
          url="http://localhost:8788"
          title="Claude Team"
          description="Claude Code team mode. Multi-agent coordination with Claude instances working in parallel."
          port={8788}
          icon={CuteRobotIcon}
        />
      </div>
    </DashboardPageLayout>
  );
}
