"use client";

import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import AtomIcon from "@/components/icons/atom";
import { Router } from "lucide-react";

const BITROUTER_URL = process.env.NEXT_PUBLIC_BITROUTER_URL || "http://localhost:4356";

export default function BitRouterPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "BitRouter",
        description: "AI Gateway & LLM Router · :4356",
        icon: AtomIcon,
      }}
    >
      <DashboardCard
        title="BitRouter Gateway"
        description="LLM request routing & provider management"
        url={BITROUTER_URL}
        port={4356}
        icon={Router}
        external
      />
    </DashboardPageLayout>
  );
}
