"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DiagramNode } from "@/components/wireflow/diagram-node"
import { ConnectionLine } from "@/components/wireflow/connection-line"
import { SystemPanel } from "@/components/wireflow/system-panel"
import { defaultTemplate, type Node, type Connection, type Subgraph } from "@/lib/diagram-templates"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { getHealth } from "@/lib/api-client"

type NodeStatus = "green" | "blue" | "orange" | "red"
const DEFAULT_STATUS: NodeStatus = "blue"

/* Map service name keywords in the diagram to health check names */
const SERVICE_MAP: Record<string, string> = {
  hermes: "hermes-webui",
  codex: "codex-web",
  claude_agent: "claude-proxy",
  "bitrouter": "br",
  bitrouter: "bitrouter",
  router9: "r9",
  tor: "tor",
  memory_hub: "zes-memory-sync",
  opencode: "codex-web",
  runsv: "zautofetch",
}

function inferNodeStatus(id: string, label: string, healthMap: Map<string, boolean>): NodeStatus {
  const key = id.toLowerCase()
  const lbl = label.toLowerCase()

  // Check direct service match
  for (const [diagramId, svcName] of Object.entries(SERVICE_MAP)) {
    if (key === diagramId || lbl.includes(diagramId)) {
      const running = healthMap.get(svcName)
      if (running === true) return "green"
      if (running === false) return "red"
    }
  }

  // Check if any service name is in the label
  for (const [svcName, running] of healthMap) {
    if (lbl.includes(svcName) || key.includes(svcName)) {
      return running ? "green" : "red"
    }
  }

  // External providers (cloud nodes) are always "green" if api is reachable
  if (key === "openai" || key === "google" || key === "anthropic" || key === "groq" ||
      key === "openrouter" || key === "mistral" || key === "nvidia" || key === "youtube" ||
      key === "zoom" || key === "twitch") {
    return "orange"  // external — status unknown, show as info
  }

  return DEFAULT_STATUS
}

export default function StatusDiagram() {
  const [nodes] = useState<Node[]>(defaultTemplate.nodes)
  const [connections] = useState<Connection[]>(defaultTemplate.connections)
  const [subgraphs] = useState<Subgraph[]>(defaultTemplate.subgraphs)
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, NodeStatus>>(new Map())
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const diagramRef = useRef<HTMLDivElement>(null)
  const lastTouchDist = useRef<number | null>(null)

  /* Fetch health status periodically */
  useEffect(() => {
    const fetchStatus = async () => {
      const health = await getHealth()
      if (!health) return
      const hm = new Map<string, boolean>()
      for (const svc of health) {
        hm.set(svc.name, svc.running)
      }
      // Compute node statuses
      const ns = new Map<string, NodeStatus>()
      for (const node of nodes) {
        ns.set(node.id, inferNodeStatus(node.id, node.label, hm))
      }
      setNodeStatuses(ns)
    }
    fetchStatus()
    const iv = setInterval(fetchStatus, 10000)
    return () => clearInterval(iv)
  }, [nodes])

  /* Get node position by id */
  const getNodePos = useCallback((id: string) => {
    const n = nodes.find(n => n.id === id)
    return n ? { x: n.x, y: n.y } : null
  }, [nodes])

  /* Zoom controls */
  const handleZoom = useCallback((dir: number) => {
    setZoom(z => Math.max(0.2, Math.min(3, z + dir * 0.15)))
  }, [])

  /* Wheel zoom */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      handleZoom(e.deltaY > 0 ? -1 : 1)
    }
  }, [handleZoom])

  /* Pan handlers */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or alt+click for panning
    if (e.button === 1 || e.altKey) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  useEffect(() => {
    if (!isPanning) return
    const handleMove = (e: MouseEvent) => {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    }
    const handleUp = () => setIsPanning(false)
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isPanning, panStart])

  /* Touch pinch-to-zoom */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      lastTouchDist.current = d
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current) {
      e.preventDefault()
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const delta = d / lastTouchDist.current
      setZoom(z => Math.max(0.2, Math.min(3, z * delta)))
      lastTouchDist.current = d
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null
  }, [])

  /* Connection helper: get endpoint coords */
  const getEndpointPos = useCallback((nodeId: string, isOutput: boolean) => {
    const n = nodes.find(nd => nd.id === nodeId)
    if (!n) return { x: 0, y: 0 }
    // Right edge for output, left edge for input
    return {
      x: n.x + (isOutput ? 120 : 0),
      y: n.y + 40, // center of 80px height
    }
  }, [nodes])

  const statusColor = useCallback((status: NodeStatus): string => {
    switch (status) {
      case "green": return "rgba(34, 197, 94, 0.6)"
      case "orange": return "rgba(249, 115, 22, 0.6)"
      case "red": return "rgba(239, 68, 68, 0.6)"
      default: return "rgba(59, 130, 246, 0.6)"
    }
  }, [])

  return (
    <div className="glass-frost-blue relative w-full overflow-hidden rounded-xl min-h-[300px] md:min-h-[500px]">
      {/* Mini zoom toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border/30 bg-black/60 backdrop-blur-sm p-1">
        <button onClick={() => handleZoom(-1)} className="size-7 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors text-sm">−</button>
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => handleZoom(1)} className="size-7 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors text-sm">+</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="size-7 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
          <Maximize2 className="size-3" />
        </button>
      </div>

      {/* Diagram canvas */}
      <div
        ref={diagramRef}
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ minHeight: 500, height: '100%' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Zoom/pan wrapper */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isPanning ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* SVG connections layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1500, minHeight: 1200 }}>
            {connections.map((conn, i) => {
              const from = getEndpointPos(conn.from, true)
              const to = getEndpointPos(conn.to, false)
              return (
                <ConnectionLine
                  key={`conn-${i}`}
                  fromX={from.x}
                  fromY={from.y}
                  toX={to.x}
                  toY={to.y}
                  label={conn.label}
                  type={conn.type}
                  lineStyle={conn.lineStyle || "solid"}
                  isHighlighted={true}
                />
              )
            })}
          </svg>

          {/* Subgraph panels */}
          {subgraphs.map((sg) => (
            <SystemPanel key={sg.id} id={sg.id} title={sg.title} x={sg.x} y={sg.y} width={sg.width} height={sg.height} />
          ))}

          {/* Nodes */}
          {nodes.map((node) => {
            const status = nodeStatuses.get(node.id) || DEFAULT_STATUS
            const isSelected = selectedNode === node.id
            const isHovered = hoveredNode === node.id
            // Enhance the diagram-node with status-based auto-glow
            return (
              <DiagramNode
                key={node.id}
                id={node.id}
                label={node.label}
                sublabel={node.sublabel}
                type={node.type}
                x={node.x}
                y={node.y}
                system={node.system as any}
                isSelected={isSelected}
                isConnected={true}
                isHovered={isHovered}
                onSelect={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                onHover={(h) => setHoveredNode(h ? node.id : null)}
                onDrag={() => {}}  // No drag in status view
                status={status}     // NEW: pass health status for auto-glow
              />
            )
          })}
        </div>
      </div>

      {/* Status legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-border/30 bg-black/60 backdrop-blur-sm px-3 py-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
        <span className="flex items-center gap-1 text-[9px]"><span className="size-2 rounded-full" style={{ backgroundColor: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} /> Running</span>
        <span className="flex items-center gap-1 text-[9px]"><span className="size-2 rounded-full" style={{ backgroundColor: "#3b82f6", boxShadow: "0 0 6px rgba(59,130,246,0.6)" }} /> Inactive</span>
        <span className="flex items-center gap-1 text-[9px]"><span className="size-2 rounded-full" style={{ backgroundColor: "#f97316", boxShadow: "0 0 6px rgba(249,115,22,0.6)" }} /> Warning</span>
        <span className="flex items-center gap-1 text-[9px]"><span className="size-2 rounded-full" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.6)" }} /> Error</span>
      </div>
    </div>
  )
}
