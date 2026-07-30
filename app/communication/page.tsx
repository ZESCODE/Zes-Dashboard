"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import Notifications from "@/components/dashboard/notifications";
import EmailIcon from "@/components/icons/email";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";
import { getHealth, type ServiceHealth } from "@/lib/api-client";

const mockData = mockDataJson as MockData;

export default function CommunicationPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);

  useEffect(() => {
    const fetchStatus = async () => {
      const health = await getHealth();
      if (health) setServices(health);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = services.filter((s) => s.running).length;

  return (
    <DashboardPageLayout
      header={{
        title: "Communication",
        description: "Messages and alerts",
        icon: EmailIcon,
      }}
    >
      {/* System Status Summary */}
      <DashboardCard
        title="SYSTEM STATUS"
        intent={onlineCount === services.length ? "success" : "default"}
        addon={
          <Badge variant={onlineCount > 0 ? "default" : "secondary"}>
            {onlineCount}/{services.length} ONLINE
          </Badge>
        }
        className="mb-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {services.length === 0 ? (
            <div className="text-sm text-muted-foreground col-span-full text-center py-4">
              Loading service status...
            </div>
          ) : (
            services.map((svc) => (
              <div
                key={svc.name}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  svc.running
                    ? "border-success/30 bg-success/5"
                    : "border-border/30 bg-accent/10"
                )}
              >
                <Bullet
                  variant={svc.running ? "success" : "default"}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{svc.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    :{svc.port}
                  </div>
                </div>
                <Badge
                  variant={svc.running ? "default" : "secondary"}
                  className={cn(
                    "text-[9px]",
                    svc.running && "bg-success/20 text-success hover:bg-success/30"
                  )}
                >
                  {svc.running ? "ON" : "OFF"}
                </Badge>
              </div>
            ))
          )}
        </div>
      </DashboardCard>

      {/* Notifications */}
      <Notifications initialNotifications={mockData.notifications} />
    </DashboardPageLayout>
  );
}
