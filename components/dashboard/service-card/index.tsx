"use client";

import React from "react";
import { ExternalLink, Loader2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceStatus } from "@/hooks/use-service-status";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  /** URL to open when button clicked */
  url: string;
  /** Service name shown as title */
  title: string;
  /** Short description of what this service does */
  description: string;
  /** Port number for status checking */
  port: number;
  /** Optional icon (a Lucide icon component or any React component) */
  icon?: React.ElementType;
}

export default function ServiceCard({
  url,
  title,
  description,
  port,
  icon: Icon,
}: ServiceCardProps) {
  const status = useServiceStatus(port);

  const statusConfig = {
    online: {
      dot: "bg-success",
      label: "Online",
      icon: Wifi,
    },
    offline: {
      dot: "bg-destructive",
      label: "Offline",
      icon: WifiOff,
    },
    checking: {
      dot: "bg-muted-foreground/50 animate-pulse",
      label: "Checking",
      icon: Loader2,
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border/50 bg-card p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/50">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title + port */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-display font-bold">{title}</h2>
            <span className="font-mono text-[11px] text-muted-foreground/60 bg-accent/30 px-1.5 py-0.5 rounded">
              :{port}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusIcon
            className={cn(
              "size-3",
              status === "online" && "text-success",
              status === "offline" && "text-destructive"
            )}
          />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <span className="text-[10px] font-mono text-muted-foreground/40 truncate">
          {url}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button variant="default" size="sm" className="gap-1.5 text-xs">
            <ExternalLink className="size-3.5" />
            Open
          </Button>
        </a>
      </div>
    </div>
  );
}
