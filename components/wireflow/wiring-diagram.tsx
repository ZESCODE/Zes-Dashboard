"use client"

import type React from "react"
import { useState, useCallback, useMemo, useRef } from "react"
import { DiagramNode } from "./diagram-node"
import { ConnectionLine } from "./connection-line"
import { SystemPanel } from "./system-panel"
import { CodeInput } from "./code-input"
import { EditPanel } from "./edit-panel"
import { ExportDialog } from "./export-dialog"
import { parseMermaid, calculateNodePositions, calculateSubgraphBounds } from "@/lib/mermaid-parser"
import { diagramTemplates, defaultTemplate, getTemplateById, type Node, type Connection, type Subgraph } from "@/lib/diagram-templates"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, ZoomIn, ZoomOut, Maximize2, Move, LayoutTemplate, ChevronDown, Menu, X, Filter } from "lucide-react"

export default function WiringDiagram() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(defaultTemplate.id)
  const [nodes, setNodes] = useState<Node[]>(defaultTemplate.nodes)
  const [connections, setConnections] = useState<Connection[]>(defaultTemplate.connections)
  const [subgraphs, setSubgraphs] = useState<Subgraph[]>(defaultTemplate.subgraphs)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const allCableTypes = ["hdmi", "sdi", "usb", "wireless", "ethernet", "stream", "audio"]
  const [highlightedCableTypes, setHighlightedCableTypes] = useState<Set<string>>(new Set())
  const [highlightAll, setHighlightAll] = useState(false)

  const toggleCableTypeHighlight = useCallback((type: string) => {
    setHighlightedCableTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }, [])

  const toggleHighlightAll = useCallback(() => {
    setHighlightAll((prev) => !prev)
  }, [])

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const diagramRef = useRef<HTMLDivElement>(null)

  // Touch pinch-to-zoom
  const lastTouchDistRef = useRef<number | null>(null)

  const handleTemplateChange = useCallback((templateId: string) => {
    const template = getTemplateById(templateId)
    if (template) {
      setCurrentTemplateId(templateId)
      setNodes([...template.nodes])
      setConnections([...template.connections])
      setSubgraphs([...template.subgraphs])
      setSelectedNode(null)
      setPan({ x: 0, y: 0 })
      setZoom(1)
    }
  }, [])

  const handleCodeSubmit = useCallback((content: string) => {
    if (!content) {
      handleTemplateChange(currentTemplateId)
      return
    }

    try {
      const parsed = parseMermaid(content)
      const positions = calculateNodePositions(parsed)
      const bounds = calculateSubgraphBounds(parsed, positions)

      const newNodes: Node[] = parsed.nodes.map((node) => {
        const pos = positions.get(node.id) || { x: 100, y: 100 }
        return {
          ...node,
          x: pos.x,
          y: pos.y,
        }
      })

      const newConnections: Connection[] = parsed.connections

      setNodes(newNodes)
      setConnections(newConnections)
      setSubgraphs(bounds)
    } catch (error) {
      console.error("Failed to parse Mermaid:", error)
    }
  }, [])

  const getConnectedNodes = (nodeId: string) => {
    const connected = new Set<string>()
    connections.forEach((conn) => {
      if (conn.from === nodeId) connected.add(conn.to)
      if (conn.to === nodeId) connected.add(conn.from)
    })
    return connected
  }

  const handleNodeDrag = useCallback((nodeId: string, newX: number, newY: number) => {
    setNodes((prevNodes) => prevNodes.map((node) => (node.id === nodeId ? { ...node, x: newX, y: newY } : node)))
  }, [])

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes((prevNodes) => prevNodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)))
  }, [])

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId))
      setConnections((prevConnections) => prevConnections.filter((conn) => conn.from !== nodeId && conn.to !== nodeId))
      if (selectedNode === nodeId) {
        setSelectedNode(null)
      }
    },
    [selectedNode],
  )

  const handleAddNode = useCallback((node: Node) => {
    setNodes((prevNodes) => [...prevNodes, node])
  }, [])

  const handleUpdateConnection = useCallback((index: number, updates: Partial<Connection>) => {
    setConnections((prevConnections) =>
      prevConnections.map((conn, i) => (i === index ? { ...conn, ...updates } : conn)),
    )
  }, [])

  const handleDeleteConnection = useCallback((index: number) => {
    setConnections((prevConnections) => prevConnections.filter((_, i) => i !== index))
  }, [])

  const handleAddConnection = useCallback((connection: Connection) => {
    setConnections((prevConnections) => [...prevConnections, connection])
  }, [])

  const handleGroupDrag = useCallback((groupId: string, deltaX: number, deltaY: number) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.system === groupId) {
          return { ...node, x: node.x + deltaX, y: node.y + deltaY }
        }
        return node
      })
    )
    setSubgraphs((prevSubgraphs) =>
      prevSubgraphs.map((sg) => {
        if (sg.id === groupId) {
          return { ...sg, x: sg.x + deltaX, y: sg.y + deltaY }
        }
        return sg
      })
    )
  }, [])

  const handleGroupResize = useCallback((groupId: string, newWidth: number, newHeight: number) => {
    setSubgraphs((prevSubgraphs) =>
      prevSubgraphs.map((sg) => {
        if (sg.id === groupId) {
          return { ...sg, width: newWidth, height: newHeight }
        }
        return sg
      })
    )
  }, [])

  const connectedNodes = hoveredNode ? getConnectedNodes(hoveredNode) : new Set<string>()

  const diagramBounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1300, maxY: 550, width: 1300, height: 550 }
    }

    const NODE_WIDTH = 120
    const NODE_HEIGHT = 70
    const PADDING = 100

    const minX = Math.min(...nodes.map((n) => n.x)) - PADDING
    const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_WIDTH + PADDING
    const minY = Math.min(...nodes.map((n) => n.y)) - PADDING
    const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_HEIGHT + PADDING

    return {
      minX: Math.min(0, minX),
      minY: Math.min(0, minY),
      maxX: Math.max(1300, maxX),
      maxY: Math.max(550, maxY),
      width: Math.max(1300, maxX - Math.min(0, minX)),
      height: Math.max(550, maxY - Math.min(0, minY)),
    }
  }, [nodes])

  const dynamicSubgraphs = useMemo(() => {
    return subgraphs.map((sg) => {
      const systemNodes = nodes.filter((n) => n.system === sg.id)
      if (systemNodes.length === 0) return sg

      const NODE_WIDTH = 120
      const NODE_HEIGHT = 70
      const PADDING = 30

      const minX = Math.min(...systemNodes.map((n) => n.x))
      const maxX = Math.max(...systemNodes.map((n) => n.x))
      const minY = Math.min(...systemNodes.map((n) => n.y))
      const maxY = Math.max(...systemNodes.map((n) => n.y))

      return {
        ...sg,
        x: minX - PADDING,
        y: minY - PADDING - 20,
        width: maxX - minX + NODE_WIDTH + PADDING * 2,
        height: maxY - minY + NODE_HEIGHT + PADDING * 2 + 20,
      }
    })
  }, [subgraphs, nodes])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleResetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault()
        setIsPanning(true)
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      }
    },
    [pan],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        setIsPanning(true)
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
        lastTouchDistRef.current = null
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy)
        setIsPanning(false)
      }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      }
    },
    [isPanning, panStart],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
        // Pinch-to-zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const delta = (dist - lastTouchDistRef.current) * 0.005
        setZoom((prev) => Math.max(0.15, Math.min(3, prev + delta)))
        lastTouchDistRef.current = dist
      } else if (isPanning && e.touches.length === 1) {
        const touch = e.touches[0]
        setPan({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y })
      }
    },
    [isPanning, panStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
    lastTouchDistRef.current = null
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((prev) => Math.max(0.25, Math.min(3, prev + delta)))
    }
  }, [])

  const cableLegendItems = [
    { type: "hdmi", label: "HDMI", color: "bg-cyan-400" },
    { type: "sdi", label: "SDI", color: "bg-orange-400" },
    { type: "usb", label: "USB", color: "bg-green-400" },
    { type: "wireless", label: "Wireless", color: "bg-pink-400", dashed: true },
    { type: "ethernet", label: "Ethernet", color: "bg-yellow-400" },
    { type: "stream", label: "Stream", color: "bg-violet-400" },
    { type: "audio", label: "Audio", color: "bg-red-400" },
  ]

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden touch-none bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          width: `${diagramBounds.width * zoom + 500}px`,
          height: `${(diagramBounds.height + 150) * zoom + 500}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-20 border-b border-border/50 sticky top-0 bg-background/90 backdrop-blur">
        {/* Primary row */}
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-5 sm:py-3">
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-2.5 h-2.5 shrink-0 rounded-full bg-accent animate-pulse" />
            <h1 className="text-sm sm:text-lg font-bold tracking-tight text-foreground truncate">
              <span className="hidden sm:inline">ZES System — AI Routing & Orchestration</span>
              <span className="sm:hidden">ZES System</span>
            </h1>
          </div>

          {/* Desktop: zoom controls inline */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-border/50 bg-background/50">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetView} title="Reset View">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Desktop: Edit / Export */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant={showEditPanel ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setShowEditPanel(!showEditPanel)}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
            <ExportDialog nodes={nodes} connections={connections} subgraphs={dynamicSubgraphs} diagramRef={diagramRef} />
            <CodeInput onCodeSubmit={handleCodeSubmit} />
          </div>

          {/* Mobile: zoom strip */}
          <div className="flex sm:hidden items-center gap-0.5 border border-border/50 rounded-lg px-1 py-0.5 bg-background/50">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetView}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Mobile: hamburger menu */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-8 w-8"
            onClick={() => setShowMobileMenu((v) => !v)}
            aria-label="Open menu"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Mobile dropdown menu */}
        {showMobileMenu && (
          <div className="sm:hidden border-t border-border/50 bg-background/95 backdrop-blur px-3 py-3 space-y-3">
            {/* Template selector */}
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={currentTemplateId} onValueChange={(v) => { handleTemplateChange(v); setShowMobileMenu(false) }}>
                <SelectTrigger className="h-9 text-sm flex-1">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {diagramTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2">
              <Button
                variant={showEditPanel ? "default" : "outline"}
                size="sm"
                className="gap-2 flex-1"
                onClick={() => { setShowEditPanel(!showEditPanel); setShowMobileMenu(false) }}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
              <ExportDialog nodes={nodes} connections={connections} subgraphs={dynamicSubgraphs} diagramRef={diagramRef} />
              <CodeInput onCodeSubmit={handleCodeSubmit} />
            </div>

            {/* Legend toggle */}
            <button
              type="button"
              className="flex items-center gap-2 w-full text-sm text-muted-foreground"
              onClick={() => setShowLegend((v) => !v)}
            >
              <Filter className="w-4 h-4" />
              <span>Cable filters</span>
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showLegend ? "rotate-180" : ""}`} />
            </button>

            {showLegend && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
                    highlightAll
                      ? "bg-primary/20 border-primary ring-1 ring-primary text-foreground font-medium"
                      : "border-border/50 bg-muted/30 text-muted-foreground"
                  }`}
                  onClick={toggleHighlightAll}
                >
                  All
                </button>
                {cableLegendItems.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
                      highlightedCableTypes.has(item.type)
                        ? "bg-primary/20 border-primary ring-1 ring-primary text-foreground"
                        : "border-border/50 bg-muted/30 text-muted-foreground"
                    }`}
                    onClick={() => toggleCableTypeHighlight(item.type)}
                  >
                    <span className={`inline-block w-3 h-0.5 rounded-full ${item.color}`} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop: second row — template + legend */}
        <div className="hidden sm:flex items-center gap-3 px-5 py-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
            <Select value={currentTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {diagramTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-5 bg-border/50" />

          {/* Legend */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <button
              type="button"
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all ${
                highlightAll
                  ? "bg-primary/20 border-primary ring-1 ring-primary text-foreground font-medium"
                  : "border-border/50 bg-background/50 hover:bg-muted/50"
              }`}
              onClick={toggleHighlightAll}
            >
              All
            </button>
            <div className="w-px h-5 bg-border/50" />
            {cableLegendItems.map((item) => (
              <button
                key={item.type}
                type="button"
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                  highlightedCableTypes.has(item.type)
                    ? "bg-primary/20 ring-1 ring-primary text-foreground"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => toggleCableTypeHighlight(item.type)}
              >
                <span className={`inline-block w-3 h-0.5 ${item.color}`} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Edit Panel */}
      {showEditPanel && (
        <EditPanel
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onAddNode={handleAddNode}
          onUpdateConnection={handleUpdateConnection}
          onDeleteConnection={handleDeleteConnection}
          onAddConnection={handleAddConnection}
          onClose={() => setShowEditPanel(false)}
        />
      )}

      {/* Main Diagram Area */}
      <div
        ref={diagramRef}
        className={`relative p-8 ${isPanning ? "cursor-grabbing" : "cursor-default"}`}
        style={{
          minWidth: `${diagramBounds.width}px`,
          minHeight: `${diagramBounds.height}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
      >
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

        {/* SVG Connections */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: `${diagramBounds.width}px`,
            height: `${diagramBounds.height}px`,
            overflow: "visible",
          }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connections.map((conn, index) => {
            const fromNode = nodes.find((n) => n.id === conn.from)
            const toNode = nodes.find((n) => n.id === conn.to)
            if (!fromNode || !toNode) return null

            const isHighlighted =
              highlightAll ||
              highlightedCableTypes.has(conn.type) ||
              hoveredNode === conn.from ||
              hoveredNode === conn.to ||
              (selectedNode && (selectedNode === conn.from || selectedNode === conn.to))

            return (
              <ConnectionLine
                key={`${conn.from}-${conn.to}-${index}`}
                fromX={fromNode.x + 60}
                fromY={fromNode.y + 50}
                toX={toNode.x + 60}
                toY={toNode.y + 50}
                label={conn.label}
                type={conn.type}
                lineStyle={conn.lineStyle}
                isHighlighted={!!isHighlighted}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <DiagramNode
            key={node.id}
            {...node}
            isSelected={selectedNode === node.id}
            isConnected={highlightAll || connectedNodes.has(node.id)}
            isHovered={hoveredNode === node.id}
            onSelect={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            onHover={(hovered) => setHoveredNode(hovered ? node.id : null)}
            onDrag={handleNodeDrag}
          />
        ))}
      </div>

      {/* Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/50 bg-background/85 backdrop-blur px-3 py-2 sm:px-5 sm:py-3">
        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
          {/* Left: stats */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>{nodes.length} nodes</span>
            <span className="hidden sm:inline">{connections.length} connections</span>
            <span className="hidden sm:inline">{Math.round(zoom * 100)}%</span>
            <span className="hidden md:flex items-center gap-1 text-primary/60">
              <Move className="w-3 h-3" />
              1-finger pan · 2-finger zoom
            </span>
          </div>
          {/* Right: status */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-medium">Active</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
