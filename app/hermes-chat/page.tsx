"use client";

import DashboardPageLayout from "@/components/dashboard/layout";
import { HermesChat } from "@/components/dashboard/hermes-chat";
import ZesIcon from "@/components/icons/zes-icon";

export default function HermesChatPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Hermes Chat",
        description: "Conversations with memory & context",
        icon: ZesIcon,
      }}
    >
      <HermesChat />
    </DashboardPageLayout>
  );
}
