"use client"

import type React from "react"
import { useState, useCallback, useMemo, useRef } from "react"
import { DiagramNode } from "./diagram-node"
import { ConnectionLine } from "./connection-line"
import { SystemPanel } from "./system-panel"
import {
  diagramTemplates,
  defaultTemplate,
  getTemplateById,
  type Node,
  type Connection,
  type Subgraph,
} from "@/lib/diagram-templates"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZoomIn, ZoomOut, Maximize2, LayoutTemplate, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

const NODE_WIDTH = 120
const NODE_HEIGHT = 70
const PADDING = 100

const cableLegend = [
  { type: "hdmi", label: "HDMI", color: "bg-cyan-400" },
  { type: "sdi", label: "SDI", color: "bg-orange-400" },
  { type: "usb", label: "USB", color: "bg-green-400" },
  { type: "wireless", label: "Wireless", color: "bg-pink-400", dashed: true },
  { type: "ethernet", label: "Ethernet", color: "bg-yellow-400" },
  { type: "stream", label: "Stream", color: "bg-violet-400" },
  { type: "audio", label: "Audio", color: "bg-red-400" },
] as const

export default function WiringDiagram() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(defaultTemplate.id)
  const [nodes, setNodes] = useState<Node[]>(defaultTemplate.nodes)
  const [connections, setConnections] = useState<Connection[]>(defaultTemplate.connections)
  const [subgraphs, setSubgraphs] = useState<Subgraph[]>(defaultTemplate.subgraphs)
  const [highlightedCableTypes, setHighlightedCableTypes] = useState<Set<string>>(new Set())
  const [showLegend, setShowLegend] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const lastTouchDistRef = useRef<number | null>(null)

  // ── Template change ──────────────────────────────────────────
  const handleTemplateChange = useCallback((id: string) => {
    const t = getTemplateById(id)
    if (!t) return
    setCurrentTemplateId(id)
    setNodes([...t.nodes])
    setConnections([...t.connections])
    setSubgraphs([...t.subgraphs])
    setSelectedNode(null)
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }, [])

  // ── Node interaction ─────────────────────────────────────────
  const handleNodeDrag = useCallback((nodeId: string, newX: number, newY: number) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x: newX, y: newY } : n)))
  }, [])

  const handleGroupDrag = useCallback((groupId: string, deltaX: number, deltaY: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.system === groupId ? { ...n, x: n.x + deltaX, y: n.y + deltaY } : n)),
    )
    setSubgraphs((prev) =>
      prev.map((sg) => (sg.id === groupId ? { ...sg, x: sg.x + deltaX, y: sg.y + deltaY } : sg)),
    )
  }, [])

  // ── Cable filter ─────────────────────────────────────────────
  const toggleCableType = useCallback((type: string) => {
    setHighlightedCableTypes((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }, [])

  // ── Zoom / pan ───────────────────────────────────────────────
  const handleZoomIn = useCallback(() => setZoom((p) => Math.min(p + 0.25, 3)), [])
  const handleZoomOut = useCallback(() => setZoom((p) => Math.max(p - 0.25, 0.25)), [])
  const handleResetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => setIsPanning(false), [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0]
      setIsPanning(true)
      setPanStart({ x: t.clientX - pan.x, y: t.clientY - pan.y })
      lastTouchDistRef.current = null
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy)
      setIsPanning(false)
    }
  }, [pan])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      setZoom((p) => Math.max(0.15, Math.min(3, p + (dist - lastTouchDistRef.current!) * 0.005)))
      lastTouchDistRef.current = dist
    } else if (isPanning && e.touches.length === 1) {
      const t = e.touches[0]
      setPan({ x: t.clientX - panStart.x, y: t.clientY - panStart.y })
    }
  }, [isPanning, panStart])

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
    lastTouchDistRef.current = null
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom((p) => Math.max(0.25, Math.min(3, p + (e.deltaY > 0 ? -0.1 : 0.1))))
    }
  }, [])

  // ── Connected nodes for highlight ───────────────────────────
  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>()
    const set = new Set<string>()
    connections.forEach((c) => {
      if (c.from === hoveredNode) set.add(c.to)
      if (c.to === hoveredNode) set.add(c.from)
    })
    return set
  }, [hoveredNode, connections])

  // ── Diagram bounds ───────────────────────────────────────────
  const diagramBounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, width: 1300, height: 550 }
    const minX = Math.min(...nodes.map((n) => n.x)) - PADDING
    const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_WIDTH + PADDING
    const minY = Math.min(...nodes.map((n) => n.y)) - PADDING
    const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_HEIGHT + PADDING
    return {
      minX: Math.min(0, minX),
      minY: Math.min(0, minY),
      width: Math.max(1300, maxX - Math.min(0, minX)),
      height: Math.max(550, maxY - Math.min(0, minY)),
    }
  }, [nodes])

  // ── Dynamic subgraph bounds ──────────────────────────────────
  const dynamicSubgraphs = useMemo(() => {
    return subgraphs.map((sg) => {
      const sysNodes = nodes.filter((n) => n.system === sg.id)
      if (sysNodes.length === 0) return sg
      const pad = 30
      const minX = Math.min(...sysNodes.map((n) => n.x))
      const maxX = Math.max(...sysNodes.map((n) => n.x))
      const minY = Math.min(...sysNodes.map((n) => n.y))
      const maxY = Math.max(...sysNodes.map((n) => n.y))
      return {
        ...sg,
        x: minX - pad,
        y: minY - pad - 20,
        width: maxX - minX + NODE_WIDTH + pad * 2,
        height: maxY - minY + NODE_HEIGHT + pad * 2 + 20,
      }
    })
  }, [subgraphs, nodes])

  // ── Node center helper ───────────────────────────────────────
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return null
    return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT / 2 }
  }

  const allHighlighted = highlightedCableTypes.size === 0

  return (
    <div
      className="relative w-full h-full overflow-hidden touch-none select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setSelectedNode(null)}
    >
      {/* ── Background grid ── */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: `${diagramBounds.width + 500}px`,
          height: `${diagramBounds.height + 500}px`,
        }}
      >
        <svg className="w-full h-full">
          <defs>
            <pattern id="infra-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#infra-grid)" />
        </svg>
      </div>

      {/* ── Main canvas ── */}
      <div
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: `${diagramBounds.width}px`,
          height: `${diagramBounds.height}px`,
          cursor: isPanning ? "grabbing" : "default",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
      >
        {/* Subgraph panels */}
        {dynamicSubgraphs.map((sg) => (
          <SystemPanel
            key={sg.id}
            id={sg.id}
            title={sg.title}
            x={sg.x}
            y={sg.y}
            width={sg.width}
            height={sg.height}
            onDrag={handleGroupDrag}
          />
        ))}

        {/* SVG connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: diagramBounds.width, height: diagramBounds.height }}
        >
          {connections.map((conn, i) => {
            const from = getNodeCenter(conn.from)
            const to = getNodeCenter(conn.to)
            if (!from || !to) return null

            const isTypeHighlighted = highlightedCableTypes.has(conn.type)
            const isNodeHighlighted =
              hoveredNode === conn.from ||
              hoveredNode === conn.to ||
              selectedNode === conn.from ||
              selectedNode === conn.to

            const isHighlighted =
              allHighlighted
                ? isNodeHighlighted
                : isTypeHighlighted && (hoveredNode === null || isNodeHighlighted)

            return (
              <ConnectionLine
                key={i}
                fromX={from.x}
                fromY={from.y}
                toX={to.x}
                toY={to.y}
                label={conn.label}
                type={conn.type}
                lineStyle={conn.lineStyle}
                isHighlighted={isHighlighted || (allHighlighted && hoveredNode === null)}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode === node.id
          const isHovered = hoveredNode === node.id
          const isConnected = connectedNodes.has(node.id)
          return (
            <DiagramNode
              key={node.id}
              {...node}
              isSelected={isSelected}
              isConnected={isConnected}
              isHovered={isHovered}
              onSelect={() => setSelectedNode(isSelected ? null : node.id)}
              onHover={(h) => setHoveredNode(h ? node.id : null)}
              onDrag={handleNodeDrag}
            />
          )
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
        {/* Template selector */}
        <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur border border-border rounded-lg px-2 py-1.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={currentTemplateId} onValueChange={handleTemplateChange}>
            <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-xs font-mono w-[160px] focus:ring-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {diagramTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs font-mono">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center bg-background/90 backdrop-blur border border-border rounded-lg overflow-hidden">
          <button
            onClick={handleZoomOut}
            className="px-2 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-[10px] font-mono text-muted-foreground border-x border-border">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="px-2 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="px-2 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground border-l border-border"
            title="Reset view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowLegend((p) => !p)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-mono transition-colors backdrop-blur",
            showLegend
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-background/90 border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* ── Cable legend / filter ── */}
      {showLegend && (
        <div className="absolute top-14 left-3 z-20 bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">
            Connection Types
          </div>
          <div className="flex flex-col gap-1.5">
            {cableLegend.map((item) => {
              const active = highlightedCableTypes.has(item.type)
              return (
                <button
                  key={item.type}
                  onClick={() => toggleCableType(item.type)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded text-xs font-mono transition-colors",
                    active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <div className={cn("w-4 h-0.5 rounded-full", item.color, "dashed" in item && item.dashed ? "opacity-60" : "")} />
                  {item.label}
                  {active && (
                    <div className={cn("w-1.5 h-1.5 rounded-full ml-auto", item.color)} />
                  )}
                </button>
              )
            })}
          </div>
          {highlightedCableTypes.size > 0 && (
            <button
              onClick={() => setHighlightedCableTypes(new Set())}
              className="mt-2 w-full text-[10px] text-muted-foreground hover:text-foreground font-mono text-center hover:bg-accent/50 rounded py-0.5 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* ── Selected node info ── */}
      {selectedNode && (() => {
        const node = nodes.find((n) => n.id === selectedNode)
        if (!node) return null
        const nodeConns = connections.filter((c) => c.from === node.id || c.to === node.id)
        return (
          <div className="absolute bottom-3 left-3 z-20 bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl max-w-xs">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">{node.type}</div>
            <div className="font-mono font-bold text-sm text-foreground">{node.label}</div>
            {node.sublabel && (
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{node.sublabel}</div>
            )}
            {nodeConns.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {nodeConns.map((c, i) => {
                  const other = c.from === node.id ? c.to : c.from
                  return (
                    <span
                      key={i}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-accent/50 text-muted-foreground"
                    >
                      {c.type}: {other}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Hint ── */}
      <div className="absolute bottom-3 right-3 z-10 text-[9px] text-muted-foreground/50 font-mono text-right">
        Alt+drag or middle-click to pan · Ctrl+scroll to zoom · Click node for details
      </div>
    </div>
  )
}
