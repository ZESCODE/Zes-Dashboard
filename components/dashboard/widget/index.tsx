"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TVNoise from "@/components/ui/tv-noise";
import type { WidgetData } from "@/types/dashboard";

interface WidgetProps {
  widgetData: WidgetData;
}

export default function Widget({ widgetData }: WidgetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = () => {
    const d = new Date();
    return d.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDatePart = () => {
    const d = new Date();
    return {
      dayOfWeek: d.toLocaleDateString("en-US", { weekday: "long" }),
      restOfDate: d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  };

  const dateInfo = formatDatePart();

  return (
    <Card className="w-full aspect-[2] relative overflow-hidden">
      <TVNoise opacity={0.3} intensity={0.2} speed={40} />
      <CardContent className="bg-accent/30 flex-1 flex flex-col justify-between text-sm font-medium uppercase relative z-20">
        <div className="flex justify-between items-center">
          <span className="opacity-50">{mounted ? dateInfo.dayOfWeek : ""}</span>
          <span>{mounted ? dateInfo.restOfDate : ""}</span>
        </div>
        <div className="text-center">
          <div className="text-5xl font-display">
            {mounted ? formatTime() : ""}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="opacity-50">{widgetData.temperature}</span>
          <span>{widgetData.location}</span>

          <Badge variant="secondary" className="bg-accent">
            {widgetData.timezone}
          </Badge>
        </div>

        <div className="absolute inset-0 -z-[1]">
          <img
            src="/assets/pc_blueprint.gif"
            alt="logo"
            className="size-full object-contain"
          />
        </div>
      </CardContent>
    </Card>
  );
}
