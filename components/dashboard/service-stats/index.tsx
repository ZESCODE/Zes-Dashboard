"use client";

import React from "react";

interface ServiceStatsProps {
  className?: string;
}

export function ServiceStats({ className = "" }: ServiceStatsProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-frost-green rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">—</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Running</div>
        </div>
        <div className="glass-frost-blue rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">—</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
        </div>
        <div className="glass-frost-red rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-400">—</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Stopped</div>
        </div>
      </div>
    </div>
  );
}
