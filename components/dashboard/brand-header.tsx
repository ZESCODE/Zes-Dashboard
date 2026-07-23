"use client";

import React from "react";
import ZesIcon from "@/components/icons/zes-icon";

export default function BrandHeader() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20 bg-background/80 backdrop-blur-sm">
      {/* Z logo with gradient border */}
      <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1.5px] shadow-sm shadow-indigo-500/10">
        <div className="flex size-full items-center justify-center rounded-[7px] bg-black">
          <ZesIcon className="size-6" />
        </div>
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
      </div>

      {/* ZES text */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          ZES
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
          Orchestration System
        </span>
      </div>
    </div>
  );
}
