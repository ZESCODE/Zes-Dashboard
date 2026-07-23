"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Clock, Activity, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import DashboardCard from "@/components/dashboard/card";

/* ────────────── Types ────────────── */

interface HealthEvent {
  time: string;
  service: string;
  status: string;
  detail: string;
}

/* ────────────── Config ────────────── */

const eventStyles: Record<string, { icon: React.ElementType; className: string }> = {
  up:     { icon: CheckCircle2, className: "text-success" },
  down:   { icon: XCircle,     className: "text-destructive" },
  start:  { icon: Activity,     className: "text-info" },
  stop:   { icon: AlertTriangle, className: "text-warning" },
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

/* ────────────── Main ────────────── */

export default function ActivityFeed({ className }: { className?: string }) {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5002/api/health/events");
      const data = await res.json();
      if (data.events) {
        setEvents(data.events.slice(-20).reverse());
        setConnected(true);
      }
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const iv = setInterval(fetchEvents, 8000);
    return () => clearInterval(iv);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <DashboardCard
      title="LIVE ACTIVITY"
      intent="default"
      addon={
        <span className="flex items-center gap-1.5">
          <span className={cn(
            "inline-block size-1.5 rounded-full",
            connected ? "bg-success animate-pulse" : "bg-destructive"
          )} />
          <span className="text-[10px] font-mono text-muted-foreground">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </span>
      }
      className={cn("max-h-[400px] overflow-hidden", className)}
    >
      <div ref={scrollRef} className="space-y-1 overflow-y-auto max-h-[320px] pr-1">
        {events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="size-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No recent events</p>
          </div>
        )}
        {events.map((ev, i) => {
          const style = eventStyles[ev.status] || eventStyles.up;
          const Icon = style.icon;
          return (
            <div
              key={`${ev.time}-${i}`}
              className="flex items-start gap-2 py-1.5 border-b border-border/10 last:border-0"
            >
              <Icon className={cn("size-3 mt-0.5 shrink-0", style.className)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium truncate">{ev.service}</span>
                  <span className={cn(
                    "text-[10px] font-semibold uppercase",
                    style.className
                  )}>
                    {ev.status}
                  </span>
                </div>
                {ev.detail && (
                  <p className="text-[10px] text-muted-foreground truncate">{ev.detail}</p>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                {formatTime(ev.time)}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
