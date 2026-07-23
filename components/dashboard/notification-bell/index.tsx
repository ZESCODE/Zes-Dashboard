"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bell, BellDot, X, RefreshCw, Activity, CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface HealthEvent {
  id: string;
  type: "up" | "down" | "start" | "stop" | "restart";
  service: string;
  message: string;
  timestamp: string;
}

export function NotificationBell() {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:5002/api/health/events");
      if (res.ok) {
        const data = await res.json();
        const list: HealthEvent[] = (data.events || data || []).slice(0, 20);
        if (list.length > events.length) {
          setUnread((prev) => prev + (list.length - events.length));
        }
        setEvents(list);
      }
    } catch {}
  }, [events.length]);

  useEffect(() => {
    fetchEvents();
    pollRef.current = setInterval(fetchEvents, 20000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const clearUnread = () => setUnread(0);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "up": return CheckCircle2;
      case "down": return AlertTriangle;
      case "start": return Activity;
      case "stop": return X;
      case "restart": return RefreshCw;
      default: return Info;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "up": return "text-emerald-400";
      case "down": return "text-destructive";
      case "start": return "text-info";
      case "stop": return "text-muted-foreground";
      case "restart": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); clearUnread(); }}
        className="relative size-8 rounded-lg hover:bg-accent/20 flex items-center justify-center transition-colors"
        aria-label="Notifications"
      >
        {unread > 0 ? (
          <>
            <BellDot className="size-4 text-warning" />
            <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-destructive text-[8px] font-bold flex items-center justify-center text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          </>
        ) : (
          <Bell className="size-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-80 rounded-xl border border-border/40 bg-card shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Service Events
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">{events.length} events</span>
            </div>
            <div className="overflow-y-auto max-h-64">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="size-5 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No recent events</p>
                </div>
              ) : (
                events.map((evt, i) => {
                  const Icon = getEventIcon(evt.type);
                  return (
                    <div key={evt.id || i} className="flex items-start gap-2 px-3 py-2 hover:bg-accent/10 transition-colors border-b border-border/10 last:border-0">
                      <Icon className={cn("size-3.5 mt-0.5 shrink-0", getEventColor(evt.type))} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs leading-tight">{evt.message}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono text-muted-foreground">{evt.service}</span>
                          {evt.timestamp && (
                            <span className="text-[9px] font-mono text-muted-foreground/50">
                              {new Date(evt.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
