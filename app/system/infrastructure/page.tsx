"use client";

import DashboardPageLayout from "@/components/dashboard/layout";
import WiringDiagram from "@/components/dashboard/infrastructure/wiring-diagram";
import CloudIcon from "@/components/icons/cloud";

export default function InfrastructurePage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Infrastructure",
        description: "AI routing, service topology & connection wiring",
        icon: CloudIcon,
      }}
    >
      <div
        className="rounded-xl border border-border overflow-hidden"
        style={{ height: "calc(100vh - 10rem)", minHeight: 500 }}
      >
        <WiringDiagram />
      </div>
    </DashboardPageLayout>
  );
}
