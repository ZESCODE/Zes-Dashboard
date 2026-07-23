"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

/* ────────────── Types ────────────── */

export interface OrgNode {
  id: string;
  name: string;
  role: string;
  title: string;
  status: string;
  budgetMonthlyCents: number;
  spentMonthCents: number;
  reports: OrgNode[];
}

interface LayoutNode {
  id: string;
  name: string;
  role: string;
  title: string;
  status: string;
  budgetMonthlyCents: number;
  spentMonthCents: number;
  x: number;
  y: number;
  children: LayoutNode[];
}

interface Point { x: number; y: number; }

/* ────────────── Layout Constants ────────────── */

const CARD_W = 180;
const CARD_H = 72;
const GAP_X = 24;
const GAP_Y = 64;
const PADDING = 40;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;

/* ────────────── Layout Algorithm ────────────── */

function subtreeWidth(node: OrgNode): number {
  if (node.reports.length === 0) return CARD_W;
  const childrenW = node.reports.reduce((sum, c) => sum + subtreeWidth(c), 0);
  const gaps = (node.reports.length - 1) * GAP_X;
  return Math.max(CARD_W, childrenW + gaps);
}

function layoutTree(node: OrgNode, x: number, y: number): LayoutNode {
  const totalW = subtreeWidth(node);
  const children: LayoutNode[] = [];

  if (node.reports.length > 0) {
    const childrenW = node.reports.reduce((sum, c) => sum + subtreeWidth(c), 0);
    const gaps = (node.reports.length - 1) * GAP_X;
    let cx = x + (totalW - childrenW - gaps) / 2;
    for (const child of node.reports) {
      const cw = subtreeWidth(child);
      children.push(layoutTree(child, cx, y + CARD_H + GAP_Y));
      cx += cw + GAP_X;
    }
  }

  return {
    id: node.id,
    name: node.name,
    role: node.role,
    title: node.title,
    status: node.status,
    budgetMonthlyCents: node.budgetMonthlyCents,
    spentMonthCents: node.spentMonthCents,
    x: x + (totalW - CARD_W) / 2,
    y,
    children,
  };
}

function layoutForest(roots: OrgNode[]): LayoutNode[] {
  if (roots.length === 0) return [];
  const totalW = roots.reduce((sum, r) => sum + subtreeWidth(r), 0);
  const gaps = (roots.length - 1) * GAP_X;
  let x = PADDING;
  const result: LayoutNode[] = [];
  for (const root of roots) {
    const w = subtreeWidth(root);
    result.push(layoutTree(root, x, PADDING));
    x += w + GAP_X;
  }
  return result;
}

function flattenLayout(nodes: LayoutNode[]): LayoutNode[] {
  const result: LayoutNode[] = [];
  function walk(n: LayoutNode) { result.push(n); n.children.forEach(walk); }
  nodes.forEach(walk);
  return result;
}

function collectEdges(nodes: LayoutNode[]): Array<{ parent: LayoutNode; child: LayoutNode }> {
  const edges: Array<{ parent: LayoutNode; child: LayoutNode }> = [];
  function walk(n: LayoutNode) {
    for (const c of n.children) {
      edges.push({ parent: n, child: c });
      walk(c);
    }
  }
  nodes.forEach(walk);
  return edges;
}

function clampZoom(v: number): number {
  return Math.min(Math.max(v, MIN_ZOOM), MAX_ZOOM);
}

/* ────────────── Status helpers ────────────── */

function statusDotColor(status: string): string {
  switch (status) {
    case "running": return "#22d3ee";
    case "active":  return "#4ade80";
    case "paused":  return "#facc15";
    case "error":   return "#f87171";
    default:        return "#a3a3a3";
  }
}

function roleBgColor(role: string): string {
  switch (role) {
    case "ceo":            return "rgba(168,85,247,0.15)";
    case "engineer":       return "rgba(59,130,246,0.15)";
    case "communicator":   return "rgba(34,211,238,0.15)";
    case "infrastructure": return "rgba(245,158,11,0.15)";
    default:               return "rgba(100,100,100,0.15)";
  }
}

function roleColor(role: string): string {
  switch (role) {
    case "ceo":            return "#a855f7";
    case "engineer":       return "#3b82f6";
    case "communicator":   return "#22d3ee";
    case "infrastructure": return "#f59e0b";
    default:               return "#a3a3a3";
  }
}

/* ────────────── SVG Path for connector lines ────────────── */

function connectorPath(px: number, py: number, cx: number, cy: number): string {
  const mx = px + CARD_W / 2;
  const my = py + CARD_H;
  const tx = cx + CARD_W / 2;
  const ty = cy;
  const midY = (my + ty) / 2;
  return `M ${mx} ${my} C ${mx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
}

/* ────────────── Props ────────────── */

interface OrgChartProps {
  nodes: OrgNode[];
  onAgentClick?: (agentId: string) => void;
  onReassign?: (agentId: string, newParentId: string | null) => void;
  compact?: boolean;
}

/* ────────────── Main Component ────────────── */

export default function OrgChart({ nodes, onAgentClick, onReassign, compact = false }: OrgChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const panStart = useRef<Point>({ x: 0, y: 0 });

  // DnD state
  const [dragAgentId, setDragAgentId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<Point | null>(null);
  const [reassigning, setReassigning] = useState(false);

  const layout = layoutForest(nodes);
  const flat = flattenLayout(layout);
  const edges = collectEdges(layout);

  // Compute bounds for SVG
  const maxX = flat.length > 0 ? Math.max(...flat.map((n) => n.x + CARD_W)) + PADDING : 400;
  const maxY = flat.length > 0 ? Math.max(...flat.map((n) => n.y + CARD_H)) + PADDING : 300;

  // Pinch zoom state
  const lastPinchDist = useRef(0);
  const lastPinchCenter = useRef<Point>({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => clampZoom(z * delta));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !dragAgentId) {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    }
  }, [pan, dragAgentId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragAgentId && svgRef.current) {
      // Get SVG-relative coordinates
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - pan.x) / zoom;
      const svgY = (e.clientY - rect.top - pan.y) / zoom;
      setDragPos({ x: svgX, y: svgY });

      // Find which card is under the cursor
      const under = flat.find((n) =>
        n.id !== dragAgentId &&
        svgX >= n.x && svgX <= n.x + CARD_W &&
        svgY >= n.y && svgY <= n.y + CARD_H
      );
      setDropTargetId(under ? under.id : null);
      return;
    }
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }, [dragging, dragAgentId, flat, pan, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    // If we were dragging a card and have a valid drop target
    if (dragAgentId && dropTargetId && onReassign && !reassigning) {
      setReassigning(true);
      onReassign(dragAgentId, dropTargetId);
      // Reset after a short delay
      setTimeout(() => setReassigning(false), 500);
    }
    // If dropped on empty space (make root)
    if (dragAgentId && !dropTargetId && onReassign && !reassigning) {
      setReassigning(true);
      onReassign(dragAgentId, null);
      setTimeout(() => setReassigning(false), 500);
    }
    setDragAgentId(null);
    setDropTargetId(null);
    setDragPos(null);
  }, [dragAgentId, dropTargetId, onReassign, reassigning]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStart.current = { ...pan };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      lastPinchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        setZoom((z) => clampZoom(z * scale));
      }
      lastPinchDist.current = dist;
    }
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    lastPinchDist.current = 0;
  }, []);

  const zoomIn = () => setZoom((z) => clampZoom(z * 1.2));
  const zoomOut = () => setZoom((z) => clampZoom(z / 1.2));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Get drag source node position
  const dragNode = flat.find((n) => n.id === dragAgentId);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No agents to display in org chart
      </div>
    );
  }

  return (
    <div className="relative" style={compact ? { maxHeight: 400, overflow: "hidden" } : {}}>
      {/* Zoom controls */}
      {!compact && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button onClick={zoomIn} className="size-7 rounded-md bg-background/80 border border-border flex items-center justify-center text-xs hover:bg-accent transition-colors">+</button>
          <button onClick={zoomOut} className="size-7 rounded-md bg-background/80 border border-border flex items-center justify-center text-xs hover:bg-accent transition-colors">−</button>
          <button onClick={resetView} className="size-7 rounded-md bg-background/80 border border-border flex items-center justify-center text-[9px] hover:bg-accent transition-colors">⟲</button>
          <span className="size-7 flex items-center justify-center text-[10px] font-mono text-muted-foreground">{Math.round(zoom * 100)}%</span>
          {onReassign && (
            <span className="ml-2 text-[9px] text-muted-foreground/60 flex items-center gap-1">
              ⠿ Drag cards to reassign
            </span>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-lg border border-border/50 bg-accent/5 cursor-grab active:cursor-grabbing"
        style={{ height: compact ? 380 : 500 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${maxX} ${maxY}`}
          style={{
            transform: `translate(${pan.x / zoom}px, ${pan.y / zoom}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: dragging ? "none" : "transform 0.1s ease",
          }}
        >
          {/* Connector lines */}
          {edges.map((edge) => {
            const isHighlighted = dropTargetId === edge.child.id && dragAgentId;
            return (
              <path
                key={`edge-${edge.parent.id}-${edge.child.id}`}
                d={connectorPath(edge.parent.x, edge.parent.y, edge.child.x, edge.child.y)}
                fill="none"
                stroke={isHighlighted ? "#22d3ee" : "hsl(var(--border))"}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                strokeOpacity={isHighlighted ? 1 : 0.6}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Agent cards */}
          {flat.map((node) => {
            const pct = node.budgetMonthlyCents > 0
              ? Math.round((node.spentMonthCents / node.budgetMonthlyCents) * 100) : 0;
            const isDragTarget = dragAgentId === node.id;
            const isDropTarget = dropTargetId === node.id;
            const isDragging = dragAgentId !== null;

            return (
              <g
                key={node.id}
                onClick={(e) => {
                  if (!isDragging) onAgentClick?.(node.id);
                }}
                onMouseDown={(e) => {
                  // Start card drag if reassign is enabled
                  if (onReassign && e.button === 0) {
                    e.stopPropagation();
                    setDragAgentId(node.id);
                    // Update drag position immediately
                    if (svgRef.current) {
                      const rect = svgRef.current.getBoundingClientRect();
                      const svgX = (e.clientX - rect.left - pan.x) / zoom;
                      const svgY = (e.clientY - rect.top - pan.y) / zoom;
                      setDragPos({ x: svgX, y: svgY });
                    }
                  }
                }}
                style={{
                  cursor: onReassign ? "grab" : (onAgentClick ? "pointer" : "default"),
                  opacity: isDragTarget ? 0.4 : 1,
                }}
              >
                {/* Drop target highlight ring */}
                {isDropTarget && (
                  <rect
                    x={node.x - 3}
                    y={node.y - 3}
                    width={CARD_W + 6}
                    height={CARD_H + 6}
                    rx={10}
                    ry={10}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                )}
                {/* Card background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={CARD_W}
                  height={CARD_H}
                  rx={8}
                  ry={8}
                  fill={isDropTarget ? "rgba(34, 211, 238, 0.08)" : "hsl(var(--card))"}
                  stroke={isDropTarget ? "#22d3ee" : "hsl(var(--border))"}
                  strokeWidth={isDropTarget ? 1.5 : 1}
                  className="transition-all duration-200 hover:stroke-primary/50"
                />
                {/* Left accent bar */}
                <rect
                  x={node.x}
                  y={node.y + 8}
                  width={3}
                  height={CARD_H - 16}
                  rx={1.5}
                  ry={1.5}
                  fill={roleColor(node.role)}
                  opacity={0.6}
                />
                {/* Status dot */}
                <circle cx={node.x + 16} cy={node.y + 18} r={5} fill={statusDotColor(node.status)} />
                {/* Name */}
                <text x={node.x + 28} y={node.y + 22} fill="hsl(var(--foreground))" fontSize={13} fontWeight="600" fontFamily="var(--font-display), sans-serif">
                  {node.name.length > 14 ? node.name.slice(0, 13) + "…" : node.name}
                </text>
                {/* Role badge */}
                <rect x={node.x + 28} y={node.y + 28} width={node.role.length * 7 + 10} height={16} rx={3} ry={3} fill={roleBgColor(node.role)} />
                <text x={node.x + 33} y={node.y + 39} fill={roleColor(node.role)} fontSize={9} fontWeight="600" fontFamily="monospace">
                  {node.role.toUpperCase()}
                </text>
                {/* Budget bar */}
                <rect x={node.x + 10} y={node.y + CARD_H - 14} width={CARD_W - 20} height={4} rx={2} ry={2} fill="hsl(var(--muted))" />
                <rect
                  x={node.x + 10}
                  y={node.y + CARD_H - 14}
                  width={Math.min(pct, 100) * (CARD_W - 20) / 100}
                  height={4}
                  rx={2}
                  ry={2}
                  fill={pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e"}
                />
                {/* Budget text */}
                <text x={node.x + CARD_W - 10} y={node.y + CARD_H - 19} fill="hsl(var(--muted-foreground))" fontSize={8} textAnchor="end" fontFamily="monospace">
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Drag preview line — from source card to cursor */}
          {dragNode && dragPos && (
            <>
              <line
                x1={dragNode.x + CARD_W / 2}
                y1={dragNode.y + CARD_H / 2}
                x2={dragPos.x}
                y2={dragPos.y}
                stroke="#22d3ee"
                strokeWidth={2}
                strokeDasharray="5 3"
                strokeOpacity={0.7}
              />
              <circle
                cx={dragPos.x}
                cy={dragPos.y}
                r={6}
                fill="rgba(34, 211, 238, 0.2)"
                stroke="#22d3ee"
                strokeWidth={1.5}
              />
              {dropTargetId && (
                <text
                  x={dragPos.x + 12}
                  y={dragPos.y - 4}
                  fill="#22d3ee"
                  fontSize={9}
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  Reassign to {flat.find(n => n.id === dropTargetId)?.name || ""}
                </text>
              )}
              {!dropTargetId && (
                <text
                  x={dragPos.x + 12}
                  y={dragPos.y - 4}
                  fill="#a3a3a3"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  Drop on empty to make root
                </text>
              )}
            </>
          )}

          {/* Reassigning overlay */}
          {reassigning && (
            <g>
              <rect x={0} y={0} width={maxX} height={maxY} fill="rgba(0,0,0,0.3)" rx={8} />
              <text x={maxX / 2} y={maxY / 2} textAnchor="middle" fill="white" fontSize={16} fontWeight="bold" fontFamily="var(--font-display)">
                Reassigning…
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#22d3ee]" /> Running</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#4ade80]" /> Active</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#facc15]" /> Paused</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#f87171]" /> Error</span>
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#a855f7]" /> CEO</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#3b82f6]" /> Engineer</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#22d3ee]" /> Comms</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#f59e0b]" /> Infra</span>
          </span>
        </div>
      )}
    </div>
  );
}
