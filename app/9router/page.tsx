"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import ServiceCard from "@/components/dashboard/service-card";
import RouterIcon from "@/components/icons/brackets";

export default function NinerouterPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "9Router",
        description: "API gateway & routing console · :20128",
        icon: RouterIcon,
      }}
    >
      <ServiceCard
        url="http://localhost:20128/dashboard"
        title="9Router AI Gateway"
        description="AI model gateway. Routes requests to multiple LLM providers, handles rate limiting, fallbacks, and proxy management."
        port={20128}
        icon={RouterIcon}
      />
    </DashboardPageLayout>
  );
}
