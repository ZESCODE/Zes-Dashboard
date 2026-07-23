"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import ZesIcon from "@/components/icons/zes-icon";

export default function HermesPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Hermes Dashboard",
        description: "Hermes Agent FastAPI dashboard · :9119",
        icon: ZesIcon,
      }}
    >
      <ServiceCard
        url="http://localhost:9119"
        title="Hermes Agent"
        description="Hermes Agent dashboard. Memory hub browser, self-improvement review, system status, and agent health monitoring."
        port={9119}
        icon={ZesIcon}
      />
    </DashboardPageLayout>
  );
}
