"use client";

import React from "react";

interface ServiceStatsProps {
  className?: string;
}

export function ServiceStats({ className = "" }: ServiceStatsProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-accent/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-success">—</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Running</div>
        </div>
        <div className="bg-accent/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">—</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
        </div>
        <div className="bg-accent/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-destructive">—</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Stopped</div>
        </div>
      </div>
    </div>
  );
}
