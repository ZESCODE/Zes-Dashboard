"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { cn } from "@/lib/utils";
import { getHealth } from "@/lib/api-client";
import {
  Bot,
  Terminal,
  Zap,
  Router,
  Monitor,
  Database,
  Globe,
  HardDrive,
  Cloud,
  Activity,
  Server,
} from "lucide-react";
import GearIcon from "@/components/icons/gear";

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */

const INFRA_NODES = [
  // Tier 0 — Agent Layer
  { id: "codex",      label: "Codex CLI",       icon: Bot,      port: 5900,  tier: 0, col: 0 },
  { id: "claude",     label: "Claude Code",     icon: Terminal, port: 5905,  tier: 0, col: 1 },
  { id: "hermes",     label: "Hermes Agent",    icon: Zap,      port: 0,     tier: 0, col: 2 },
  // Tier 1 — Core Services
  { id: "9router",    label: "9Router Gateway", icon: Router,   port: 20128, tier: 1, col: 0 },
  { id: "amux",       label: "Teams (amux)",    icon: Monitor,  port: 8822,  tier: 1, col: 1 },
  { id: "flask-api",  label: "Flask API",       icon: Database, port: 5002,  tier: 1, col: 2 },
  // Tier 2 — Infrastructure
  { id: "zes-dashboard", label: "ZES Dashboard", icon: Monitor,   port: 7070, tier: 2, col: 0 },
  { id: "memory-hub",   label: "Memory Hub",     icon: Database,  port: 0,    tier: 2, col: 1 },
  { id: "vscode",       label: "VS Code Server", icon: HardDrive, port: 8000, tier: 2, col: 2 },
  { id: "chromium",     label: "Headless CDP",   icon: Globe,     port: 9222, tier: 2, col: 3 },
  { id: "cloudflare",   label: "Cloudflare",     icon: Cloud,     port: 0,    tier: 2, col: 4 },
];

// Directed edges: agent-tier → core-tier → infra-tier
const EDGES: [string, string][] = [
  ["codex",   "9router"],
  ["codex",   "flask-api"],
  ["claude",  "9router"],
  ["claude",  "flask-api"],
  ["hermes",  "9router"],
  ["hermes",  "flask-api"],
  ["9router", "zes-dashboard"],
  ["9router", "chromium"],
  ["9router", "cloudflare"],
  ["amux",    "zes-dashboard"],
  ["flask-api", "memory-hub"],
  ["flask-api", "vscode"],
];

/* ─────────────────────────────────────────
   Layout constants
───────────────────────────────────────── */

const NODE_W = 170;
const NODE_H = 64;
const COL_GAP = 32;
const ROW_GAP = 80;
const PADDING_X = 48;
const PADDING_Y = 48;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.2;

/* ─────────────────────────────────────────
   Compute positions
───────────────────────────────────────── */

function computeLayout() {
  const tiers = [0, 1, 2];
  const byTier = tiers.map((t) => INFRA_NODES.filter((n) => n.tier === t));

  // Find max cols per tier to center tiers with fewer columns
  const maxCols = Math.max(...byTier.map((t) => t.length));
  const canvasW = maxCols * NODE_W + (maxCols - 1) * COL_GAP + PADDING_X * 2;

  const positions: Record<string, { x: number; y: number }> = {};

  byTier.forEach((tierNodes, tierIdx) => {
    const count = tierNodes.length;
    const rowW = count * NODE_W + (count - 1) * COL_GAP;
    const startX = (canvasW - rowW) / 2;
    const y = PADDING_Y + tierIdx * (NODE_H + ROW_GAP);
    tierNodes.forEach((node, i) => {
      positions[node.id] = {
        x: startX + i * (NODE_W + COL_GAP),
        y,
      };
    });
  });

  const canvasH =
    PADDING_Y * 2 + tiers.length * NODE_H + (tiers.length - 1) * ROW_GAP;

  return { positions, canvasW, canvasH };
}

/* ─────────────────────────────────────────
   Color helpers
───────────────────────────────────────── */

type StatusT = "online" | "offline" | "unknown";

const TIER_ACCENT = [
  "#3b82f6", // blue  — agent layer
  "#a855f7", // purple — core services
  "#10b981", // emerald — infrastructure
];

function statusDot(s: StatusT) {
  if (s === "online")  return "#10b981";
  if (s === "offline") return "#ef4444";
  return "#6b7280";
}

function statusGlow(s: StatusT) {
  if (s === "online")  return "rgba(16,185,129,0.25)";
  if (s === "offline") return "rgba(239,68,68,0.15)";
  return "transparent";
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

/* ─────────────────────────────────────────
   SVG connector path (cubic bezier)
───────────────────────────────────────── */

function bezierPath(
  x1: number, y1: number,
  x2: number, y2: number
): string {
  const mx1 = x1 + NODE_W / 2;
  const my1 = y1 + NODE_H;
  const mx2 = x2 + NODE_W / 2;
  const my2 = y2;
  const midY = (my1 + my2) / 2;
  return `M ${mx1} ${my1} C ${mx1} ${midY}, ${mx2} ${midY}, ${mx2} ${my2}`;
}

/* ─────────────────────────────────────────
   Infrastructure Canvas
───────────────────────────────────────── */

interface CanvasProps {
  statusMap: Record<string, StatusT>;
}

function InfraCanvas({ statusMap }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  const { positions, canvasW, canvasH } = computeLayout();

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => clamp(z * (e.deltaY > 0 ? 0.9 : 1.1), MIN_ZOOM, MAX_ZOOM));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setPanning(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panning) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [panning]);

  const handleMouseUp = useCallback(() => setPanning(false), []);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const zoomIn  = () => setZoom((z) => clamp(z * 1.2, MIN_ZOOM, MAX_ZOOM));
  const zoomOut = () => setZoom((z) => clamp(z / 1.2, MIN_ZOOM, MAX_ZOOM));
  const reset   = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
        <button onClick={zoomIn}  className="size-7 rounded-md bg-background/80 border border-border flex items-center justify-center text-xs hover:bg-accent transition-colors">+</button>
        <button onClick={zoomOut} className="size-7 rounded-md bg-background/80 border border-border flex items-center justify-center text-xs hover:bg-accent transition-colors">−</button>
        <button onClick={reset}   className="size-7 rounded-md bg-background/80 border border-border flex items-center justify-center text-[9px] hover:bg-accent transition-colors">⟲</button>
        <span className="text-[10px] font-mono text-muted-foreground w-9 text-center">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-border/50 bg-accent/5 cursor-grab active:cursor-grabbing"
        style={{ height: 460 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          style={{
            transform: `translate(${pan.x / zoom}px, ${pan.y / zoom}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: panning ? "none" : "transform 0.1s ease",
          }}
        >
          {/* Tier labels (background strips) */}
          {[
            { y: PADDING_Y - 20, label: "AGENT LAYER", color: TIER_ACCENT[0] },
            { y: PADDING_Y + NODE_H + ROW_GAP - 20, label: "CORE SERVICES", color: TIER_ACCENT[1] },
            { y: PADDING_Y + (NODE_H + ROW_GAP) * 2 - 20, label: "INFRASTRUCTURE", color: TIER_ACCENT[2] },
          ].map((tier) => (
            <text
              key={tier.label}
              x={PADDING_X}
              y={tier.y}
              fill={tier.color}
              fontSize={9}
              fontWeight="700"
              fontFamily="monospace"
              opacity={0.7}
              letterSpacing="1"
            >
              {tier.label}
            </text>
          ))}

          {/* Edges */}
          {EDGES.map(([src, dst]) => {
            const sp = positions[src];
            const dp = positions[dst];
            if (!sp || !dp) return null;
            const isHighlighted = hovered === src || hovered === dst;
            return (
              <path
                key={`${src}-${dst}`}
                d={bezierPath(sp.x, sp.y, dp.x, dp.y)}
                fill="none"
                stroke={isHighlighted ? "#22d3ee" : "hsl(var(--border))"}
                strokeWidth={isHighlighted ? 2 : 1.2}
                strokeOpacity={isHighlighted ? 0.9 : 0.35}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Nodes */}
          {INFRA_NODES.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const status = statusMap[node.id] ?? "unknown";
            const accentColor = TIER_ACCENT[node.tier];
            const isHov = hovered === node.id;
            const Icon = node.icon;

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                {/* Glow / hover ring */}
                {(isHov || status === "online") && (
                  <rect
                    x={pos.x - 2}
                    y={pos.y - 2}
                    width={NODE_W + 4}
                    height={NODE_H + 4}
                    rx={11}
                    fill={isHov ? "rgba(34,211,238,0.06)" : statusGlow(status)}
                    stroke={isHov ? "#22d3ee" : accentColor}
                    strokeWidth={isHov ? 1.5 : 1}
                    strokeOpacity={isHov ? 1 : 0.3}
                    className="transition-all duration-200"
                  />
                )}

                {/* Card */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={9}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  strokeOpacity={0.6}
                />

                {/* Left accent stripe */}
                <rect
                  x={pos.x}
                  y={pos.y + 10}
                  width={3}
                  height={NODE_H - 20}
                  rx={1.5}
                  fill={accentColor}
                  opacity={0.55}
                />

                {/* Status dot */}
                <circle
                  cx={pos.x + NODE_W - 12}
                  cy={pos.y + 12}
                  r={4.5}
                  fill={statusDot(status)}
                  opacity={0.9}
                />

                {/* Label */}
                <text
                  x={pos.x + 18}
                  y={pos.y + 24}
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                  fontWeight="600"
                  fontFamily="var(--font-sans), sans-serif"
                >
                  {node.label.length > 17 ? node.label.slice(0, 16) + "…" : node.label}
                </text>

                {/* Port / id sub-label */}
                <text
                  x={pos.x + 18}
                  y={pos.y + 38}
                  fill="hsl(var(--muted-foreground))"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {node.port > 0 ? `127.0.0.1:${node.port}` : node.id}
                </text>

                {/* Status text */}
                <text
                  x={pos.x + 18}
                  y={pos.y + NODE_H - 8}
                  fill={statusDot(status)}
                  fontSize={8}
                  fontWeight="600"
                  fontFamily="monospace"
                  opacity={0.85}
                >
                  {status.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-5 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "#10b981" }} /> Online
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: "#ef4444" }} /> Offline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/40" /> Unknown
        </span>
        <span className="ml-auto flex items-center gap-4">
          {[0, 1, 2].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: TIER_ACCENT[t] }} />
              {["Agent Layer", "Core Services", "Infrastructure"][t]}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Stats row
───────────────────────────────────────── */

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex-1 rounded-lg bg-accent/20 px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={cn("text-xl font-display font-bold", color)}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */

export default function InfrastructurePage() {
  const [health, setHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const h = await getHealth();
      if (h) setHealth(h);
    } catch {}
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    fetchHealth();
    const iv = setInterval(fetchHealth, 15000);
    return () => clearInterval(iv);
  }, [fetchHealth]);

  // Build status map
  const statusMap: Record<string, StatusT> = {};
  for (const node of INFRA_NODES) {
    const match = health.find(
      (h: any) =>
        h.name?.toLowerCase() === node.id ||
        h.id?.toLowerCase() === node.id ||
        (node.port > 0 && h.port === node.port)
    );
    if (match !== undefined) {
      statusMap[node.id] = (match.alive ?? match.running ?? false)
        ? "online"
        : "offline";
    } else if (
      node.id === "hermes" ||
      node.id === "memory-hub" ||
      node.id === "zes-dashboard"
    ) {
      statusMap[node.id] = "online";
    } else {
      statusMap[node.id] = "unknown";
    }
  }

  const online  = Object.values(statusMap).filter((s) => s === "online").length;
  const offline = Object.values(statusMap).filter((s) => s === "offline").length;
  const unknown = Object.values(statusMap).filter((s) => s === "unknown").length;
  const total   = INFRA_NODES.length;

  return (
    <DashboardPageLayout
      header={{
        title: "Infrastructure",
        description: lastUpdated ? `Updated ${lastUpdated}` : undefined,
        icon: GearIcon,
        actions: (
          <button
            onClick={fetchHealth}
            className="h-7 px-3 rounded-md text-[10px] border border-border bg-background hover:bg-accent transition-colors"
          >
            REFRESH
          </button>
        ),
      }}
    >
      {/* Summary stats */}
      <div className="flex gap-3 flex-wrap">
        <StatPill label="Total Nodes" value={total}   color="text-foreground" />
        <StatPill label="Online"      value={online}  color="text-emerald-400" />
        <StatPill label="Offline"     value={offline} color="text-red-400" />
        <StatPill label="Unknown"     value={unknown} color="text-muted-foreground" />
      </div>

      {/* Canvas */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground animate-pulse">
          Loading infrastructure...
        </div>
      ) : (
        <InfraCanvas statusMap={statusMap} />
      )}

      {/* Node table */}
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/30">
              {["Node", "Tier", "Port", "Status"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INFRA_NODES.map((node) => {
              const status = statusMap[node.id] ?? "unknown";
              const tierLabel = ["Agent Layer", "Core Services", "Infrastructure"][node.tier];
              return (
                <tr key={node.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                  <td className="py-2 px-3 font-medium">{node.label}</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{ background: TIER_ACCENT[node.tier] + "22", color: TIER_ACCENT[node.tier] }}
                    >
                      {tierLabel}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-muted-foreground">
                    {node.port > 0 ? `:${node.port}` : "—"}
                  </td>
                  <td className="py-2 px-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: statusDot(status) }}
                      />
                      <span
                        className="font-mono text-[10px] font-semibold"
                        style={{ color: statusDot(status) }}
                      >
                        {status.toUpperCase()}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardPageLayout>
  );
}
