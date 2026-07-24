"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { LayoutGrid } from "lucide-react";
import WiringDiagram from "@/components/wireflow/wiring-diagram";

export default function WireflowPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Wireflow",
        description: "Interactive wiring diagram — system topology & infrastructure visualization",
        icon: LayoutGrid,
      }}
    >
      <WiringDiagram />
    </DashboardPageLayout>
  );
}
