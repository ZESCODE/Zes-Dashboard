import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileNotifications from "@/components/dashboard/notifications/mobile-notifications";
import type { MockData } from "@/types/dashboard";
import BellIcon from "@/components/icons/bell";

interface MobileHeaderProps {
  mockData: MockData;
}

export function MobileHeader({ mockData }: MobileHeaderProps) {
  const unreadCount = mockData.notifications.filter((n) => !n.read).length;

  return (
    <div className="lg:hidden h-header-mobile sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Sidebar Menu */}
        <SidebarTrigger />

        {/* Center: ZES brand — glow Z + gradient text */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[5px] p-[2.5px]">
            <div className="bg-black rounded-[2px] w-6 h-6 flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">Z</span>
            </div>
          </div>
          <span className="text-sm font-bold tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">ZES</span>
        </div>

        <Sheet>
          {/* Right: Notifications Menu */}
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="relative">
              {unreadCount > 0 && (
                <Badge className="absolute border-2 border-background -top-1 -left-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              <BellIcon className="size-4" />
            </Button>
          </SheetTrigger>

          {/* Notifications Sheet */}
          <SheetContent
            closeButton={false}
            side="right"
            className="w-[80%] max-w-md p-0"
          >
            <MobileNotifications
              initialNotifications={mockData.notifications}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
