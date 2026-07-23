"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Cloud, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, Download, Upload } from "lucide-react";
import Link from "next/link";

export default function CloudPage() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchCloud = useCallback(async () => {
    try {
      const res = await fetch("/api/cloud", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data.status || null);
        setBackups(data.backups || []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchCloud();
    const iv = setInterval(fetchCloud, 30000);
    return () => clearInterval(iv);
  }, [fetchCloud]);

  const createBackup = async () => {
    setBackingUp(true);
    setMsg("Creating backup...");
    try {
      const res = await fetch("/api/cloud", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMsg(`Backup ${data.backupId}: ${data.files} files (${(data.size / 1024).toFixed(1)} KB)`);
        fetchCloud();
      } else {
        setMsg("Backup failed");
      }
    } catch {
      setMsg("Error creating backup");
    } finally {
      setBackingUp(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // Calculate total backup size
  const totalSizeKB = backups.reduce((s, b) => s + (b.sizeKB || 0), 0);

  return (
    <DashboardPageLayout
      header={{
        title: "Cloud Sync",
        description: `${backups.length} backups · ${totalSizeKB.toFixed(0)} KB total · ${syncStatus?.lastSync || "Not synced"}`,
        icon: Cloud,
      }}
    >
      {/* Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-accent/15 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Cloud className="size-3.5" /> Last Backup
          </div>
          <div className="text-lg font-display font-bold">{syncStatus?.lastSync || "Never"}</div>
        </div>
        <div className="bg-accent/15 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <HardDrive className="size-3.5" /> Total Backups
          </div>
          <div className="text-lg font-display font-bold">{syncStatus?.totalBackups || 0}</div>
        </div>
        <div className="bg-accent/15 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Upload className="size-3.5" /> Backup Size
          </div>
          <div className="text-lg font-display font-bold">{totalSizeKB.toFixed(0)} KB</div>
        </div>
        <div className="bg-accent/15 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <CheckCircle2 className="size-3.5" /> Status
          </div>
          <Badge variant={backups.length > 0 ? "secondary" : "outline"} className="mt-0.5">
            {backups.length > 0 ? "Protected" : "No backups"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Action */}
        <DashboardCard title="BACKUP NOW">
          <p className="text-xs text-muted-foreground mb-4">
            Creates a timestamped snapshot of all ZES config files including company roster, task queue, roadmap, and strategy.
          </p>
          <Button
            variant="default"
            className="w-full text-xs"
            onClick={createBackup}
            disabled={backingUp}
          >
            {backingUp ? (
              <RefreshCw className="size-3.5 mr-2 animate-spin" />
            ) : (
              <Upload className="size-3.5 mr-2" />
            )}
            {backingUp ? "Backing up..." : "Create Backup"}
          </Button>
          {msg && (
            <div className={cn(
              "mt-3 text-xs px-3 py-2 rounded-md",
              msg.startsWith("Backup") ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {msg}
            </div>
          )}
        </DashboardCard>

        {/* Files */}
        <DashboardCard title="SYNCED FILES">
          <div className="space-y-2">
            {syncStatus?.files?.map((f: any) => (
              <div key={f.file} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn("size-1.5 rounded-full", f.exists ? "bg-success" : "bg-destructive")} />
                  <span className="text-muted-foreground">{f.file}</span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {f.exists ? `${(f.size / 1024).toFixed(1)} KB` : "missing"}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Info */}
        <DashboardCard title="ABOUT">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Backups are stored locally in your Hermes config directory.</p>
            <p>Each backup is a full snapshot — no incremental diffs.</p>
            <p>Oldest backups are auto-pruned (max 20).</p>
            <p className="pt-2 text-[10px]">
              Backup location:
              <code className="block mt-1 bg-accent/20 rounded px-2 py-1 font-mono text-[9px]">
                {syncStatus?.backupDir || "~/.hermes/backups/"}
              </code>
            </p>
          </div>
        </DashboardCard>
      </div>

      {/* Recent Backups */}
      <div className="mt-6">
        <DashboardCard
          title="BACKUP HISTORY"
          addon={
            <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={fetchCloud}>
              <RefreshCw className="size-3 mr-1" /> REFRESH
            </Button>
          }
        >
          {loading ? (
            <div className="space-y-2 p-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 rounded-md bg-accent/5 animate-pulse" />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Cloud className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No backups yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Your configuration files are not backed up yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={createBackup} disabled={backingUp}>
                  <Cloud className="size-3 mr-1" /> {backingUp ? "Creating..." : "Create First Backup"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {backups.map((b: any, i: number) => (
                <div key={b.id || i} className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-md bg-accent/20 flex items-center justify-center">
                      <HardDrive className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">{b.id}</div>
                      <div className="text-[10px] text-muted-foreground">{b.timestamp}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">{b.files} files</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{b.sizeKB} KB</span>
                    <Badge variant={b.status === "completed" ? "secondary" : "outline"} className="text-[8px]">
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </DashboardPageLayout>
  );
}
