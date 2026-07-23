"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("@/components/dashboard/command-palette"), { ssr: false });

export default function CommandPaletteWrapper() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
      {/* Floating hint button in bottom-right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 size-9 rounded-full bg-primary/80 hover:bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-[9px] font-mono transition-all hover:scale-105"
        title="Cmd+K to open"
      >
        <kbd className="text-[8px]">⌘K</kbd>
      </button>
    </>
  );
}
