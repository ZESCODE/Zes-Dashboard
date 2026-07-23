import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import CuteRobotIcon from "@/components/icons/cute-robot";

export default function NotFound() {
  return (
    <DashboardPageLayout
      header={{
        title: "Not found",
        description: "page under construction",
        icon: CuteRobotIcon,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-10 flex-1">
        <div className="w-1/4 aspect-square grayscale opacity-50 bg-muted rounded-full flex items-center justify-center">
          <CuteRobotIcon className="size-16 text-muted-foreground" />
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-xl font-bold uppercase text-muted-foreground">
            Not found, yet
          </h1>
          <p className="text-sm max-w-sm text-center text-muted-foreground text-balance">
            Fork on v0 and start promoting your way to new pages.
          </p>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
