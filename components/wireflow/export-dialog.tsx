"use client"

import { useState, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Copy, Check, ImageIcon, FileCode } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Node {
  id: string
  label: string
  sublabel?: string
  type: "atem" | "pc" | "device" | "converter" | "cloud" | "stream"
  x: number
  y: number
  system: "main" | "sub" | "external"
}

interface Connection {
  from: string
  to: string
  label?: string
  type: "hdmi" | "sdi" | "usb" | "wireless" | "ethernet" | "stream" | "audio"
}

interface Subgraph {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
}

interface ExportDialogProps {
  nodes: Node[]
  connections: Connection[]
  subgraphs: Subgraph[]
  diagramRef: RefObject<HTMLDivElement | null>
}

const getIconPaths = (type: string, color: string): string => {
  const sw = "stroke-width"
  const slc = "stroke-linecap"
  switch (type) {
    case "atem":
      return `
        <rect x="2" y="7" width="20" height="10" rx="2" stroke="${color}" ${sw}="2" fill="none"/>
        <circle cx="6" cy="12" r="1" fill="${color}"/>
        <circle cx="10" cy="12" r="1" fill="${color}"/>
      `
    case "pc":
      return `
        <rect x="4" y="5" width="16" height="10" rx="1" stroke="${color}" ${sw}="2" fill="none"/>
        <line x1="2" y1="17.5" x2="22" y2="17.5" stroke="${color}" ${sw}="2" ${slc}="round"/>
        <line x1="8" y1="20" x2="16" y2="20" stroke="${color}" ${sw}="2" ${slc}="round"/>
      `
    case "device":
      return `
        <rect x="2" y="4" width="20" height="12" rx="2" stroke="${color}" ${sw}="2" fill="none"/>
        <line x1="8" y1="21" x2="16" y2="21" stroke="${color}" ${sw}="2" ${slc}="round"/>
        <line x1="12" y1="17" x2="12" y2="21" stroke="${color}" ${sw}="2" ${slc}="round"/>
      `
    case "converter":
      return `
        <circle cx="12" cy="12" r="8" stroke="${color}" ${sw}="2" fill="none"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke="${color}" ${sw}="2" ${slc}="round"/>
        <line x1="12" y1="8" x2="12" y2="16" stroke="${color}" ${sw}="2" ${slc}="round"/>
      `
    case "cloud":
      return `
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" stroke="${color}" ${sw}="2" fill="none"/>
      `
    case "stream":
      return `
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="${color}" ${sw}="2" fill="none"/>
        <line x1="7" y1="21" x2="17" y2="21" stroke="${color}" ${sw}="2" ${slc}="round"/>
      `
    default:
      return `<rect x="4" y="4" width="16" height="16" rx="2" stroke="${color}" ${sw}="2" fill="none"/>`
  }
}

function generateMermaid(nodes: Node[], connections: Connection[]): string {
  const lines: string[] = ["graph LR"]

  const mainNodes = nodes.filter((n) => n.system === "main")
  const subNodes = nodes.filter((n) => n.system === "sub")
  const externalNodes = nodes.filter((n) => n.system === "external")

  const formatNodeLabel = (node: Node) => {
    if (node.sublabel) {
      return `${node.id}["${node.label}<br>${node.sublabel}"]`
    }
    return `${node.id}["${node.label}"]`
  }

  if (mainNodes.length > 0) {
    lines.push('  subgraph Main["Main System"]')
    lines.push("    direction TB")
    mainNodes.forEach((node) => {
      lines.push(`    ${formatNodeLabel(node)}`)
    })
    lines.push("  end")
    lines.push("")
  }

  if (subNodes.length > 0) {
    lines.push('  subgraph Sub["Sub System"]')
    lines.push("    direction TB")
    subNodes.forEach((node) => {
      lines.push(`    ${formatNodeLabel(node)}`)
    })
    lines.push("  end")
    lines.push("")
  }

  externalNodes.forEach((node) => {
    lines.push(`  ${formatNodeLabel(node)}`)
  })

  if (externalNodes.length > 0) {
    lines.push("")
  }

  connections.forEach((conn) => {
    if (conn.label) {
      lines.push(`  ${conn.from} -->|"${conn.label}"| ${conn.to}`)
    } else {
      lines.push(`  ${conn.from} --> ${conn.to}`)
    }
  })

  return lines.join("\n")
}

function generateJSON(nodes: Node[], connections: Connection[]): string {
  return JSON.stringify({ nodes, connections }, null, 2)
}

function generateSVG(nodes: Node[], connections: Connection[], subgraphs: Subgraph[]): string {
  const NODE_WIDTH = 120
  const NODE_HEIGHT = 70
  const PADDING = 50
  
  // SVG attribute names (using variables to prevent auto-fix from converting to camelCase)
  const ta = "text-anchor"
  const fs = "font-size"
  const ff = "font-family"
  const fw = "font-weight"
  const sw = "stroke-width"
  const sda = "stroke-dasharray"

  const minX = Math.min(...nodes.map((n) => n.x), ...subgraphs.map((s) => s.x)) - PADDING
  const minY = Math.min(...nodes.map((n) => n.y), ...subgraphs.map((s) => s.y)) - PADDING
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH), ...subgraphs.map((s) => s.x + s.width)) + PADDING
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT), ...subgraphs.map((s) => s.y + s.height)) + PADDING

  const width = maxX - minX
  const height = maxY - minY

  const typeColors: Record<string, string> = {
    atem: "#6366f1",
    pc: "#06b6d4",
    device: "#71717a",
    converter: "#f97316",
    cloud: "#ef4444",
    stream: "#22c55e",
  }

  const connectionColors: Record<string, string> = {
    hdmi: "#22d3ee",
    sdi: "#fb923c",
    usb: "#4ade80",
    wireless: "#f472b6",
    ethernet: "#facc15",
    stream: "#a78bfa",
    audio: "#f87171",
  }

  const svgParts: string[] = []

  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">`,
  )

  // Background
  svgParts.push(`<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#0a0a0a"/>`)

  // Grid pattern
  svgParts.push(`<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" ${sw}="0.5"/>
  </pattern></defs>`)
  svgParts.push(`<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="url(#grid)" opacity="0.3"/>`)

  // Subgraphs
  subgraphs.forEach((sg) => {
    svgParts.push(`<rect x="${sg.x}" y="${sg.y}" width="${sg.width}" height="${sg.height}" 
      fill="none" stroke="#6366f1" ${sw}="1" ${sda}="4 4" rx="8" opacity="0.5"/>`)
    svgParts.push(
      `<text x="${sg.x + 10}" y="${sg.y + 20}" fill="#6366f1" ${fs}="14" ${ff}="system-ui, sans-serif">${escapeXml(sg.title)}</text>`,
    )
  })

  // Connections
  connections.forEach((conn) => {
    const fromNode = nodes.find((n) => n.id === conn.from)
    const toNode = nodes.find((n) => n.id === conn.to)
    if (!fromNode || !toNode) return

    const fromX = fromNode.x + NODE_WIDTH / 2
    const fromY = fromNode.y + NODE_HEIGHT / 2
    const toX = toNode.x + NODE_WIDTH / 2
    const toY = toNode.y + NODE_HEIGHT / 2

    const color = connectionColors[conn.type] || "#888"
    const isDashed = conn.type === "wireless"

    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    const dx = toX - fromX
    const dy = toY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const offset = Math.min(50, dist / 4)
    const perpX = dist > 0 ? (-dy / dist) * offset : 0
    const perpY = dist > 0 ? (dx / dist) * offset : 0

    svgParts.push(`<path d="M ${fromX} ${fromY} Q ${midX + perpX} ${midY + perpY} ${toX} ${toY}" 
      fill="none" stroke="${color}" ${sw}="2" ${isDashed ? `${sda}="5 5"` : ""}/>`)

    if (conn.label) {
      svgParts.push(
        `<text x="${midX + perpX / 2}" y="${midY + perpY / 2 - 5}" fill="#888" ${fs}="10" ${ff}="system-ui, sans-serif" ${ta}="middle">${escapeXml(conn.label)}</text>`,
      )
    }
  })

  // Nodes
  nodes.forEach((node) => {
    const color = typeColors[node.type] || "#888"
    const iconScale = 1.5 // Increased from ~0.75 to 1.5
    const iconSize = 24 * iconScale // 36px icon
    const iconX = node.x + NODE_WIDTH / 2 - iconSize / 2
    const iconY = node.y + 6

    // Node background
    svgParts.push(`<rect x="${node.x}" y="${node.y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" 
      fill="#1a1a1a" stroke="${color}" ${sw}="2" rx="8"/>`)

    // Icon - centered horizontally
    svgParts.push(
      `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})">${getIconPaths(node.type, color)}</g>`,
    )

    // Labels - centered using text-anchor middle
    const labelY = node.y + (node.sublabel ? 52 : 56)
    svgParts.push(`<text x="${node.x + NODE_WIDTH / 2}" y="${labelY}" 
      fill="#fff" ${fs}="11" ${ff}="system-ui, sans-serif" ${ta}="middle" ${fw}="bold">${escapeXml(node.label)}</text>`)
    if (node.sublabel) {
      svgParts.push(`<text x="${node.x + NODE_WIDTH / 2}" y="${node.y + 64}" 
        fill="#888" ${fs}="9" ${ff}="system-ui, sans-serif" ${ta}="middle">${escapeXml(node.sublabel)}</text>`)
    }
  })

  svgParts.push("</svg>")
  return svgParts.join("\n")
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function ExportDialog({ nodes, connections, subgraphs, diagramRef }: ExportDialogProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const mermaidCode = generateMermaid(nodes, connections)
  const jsonCode = generateJSON(nodes, connections)

  const handleCopy = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPNG = async () => {
    setIsExporting(true)
    try {
      const svgContent = generateSVG(nodes, connections, subgraphs)

      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgContent, "image/svg+xml")
      const svgEl = svgDoc.querySelector("svg")

      if (!svgEl) throw new Error("Invalid SVG")

      const svgWidth = Number.parseInt(svgEl.getAttribute("width") || "800")
      const svgHeight = Number.parseInt(svgEl.getAttribute("height") || "600")

      const canvas = document.createElement("canvas")
      const scale = 2
      canvas.width = svgWidth * scale
      canvas.height = svgHeight * scale
      const ctx = canvas.getContext("2d")

      if (!ctx) throw new Error("Failed to get canvas context")

      const base64 = btoa(unescape(encodeURIComponent(svgContent)))
      const dataUrl = `data:image/svg+xml;base64,${base64}`

      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight)
          resolve()
        }
        img.onerror = () => {
          reject(new Error("Failed to load SVG image"))
        }
        img.src = dataUrl
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = pngUrl
          a.download = "wiring-diagram.png"
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(pngUrl)
        }
      }, "image/png")
    } catch (error) {
      console.error("[v0] Failed to export PNG:", error)
      alert("Failed to export PNG. Please try SVG export instead.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSVG = () => {
    const svgContent = generateSVG(nodes, connections, subgraphs)
    handleDownload(svgContent, "wiring-diagram.svg", "image/svg+xml")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Diagram</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="image" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <FileCode className="w-4 h-4" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">PNG Image</h4>
                    <p className="text-xs text-muted-foreground">High-resolution raster image</p>
                  </div>
                </div>
                <Button className="w-full" onClick={handleExportPNG} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Download PNG"}
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">SVG Vector</h4>
                    <p className="text-xs text-muted-foreground">Scalable vector graphics</p>
                  </div>
                </div>
                <Button className="w-full" variant="secondary" onClick={handleExportSVG}>
                  <Download className="w-4 h-4 mr-2" />
                  Download SVG
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
              <h4 className="text-sm font-medium mb-2">Preview</h4>
              <div
                className="bg-background rounded overflow-auto max-h-64"
                dangerouslySetInnerHTML={{ __html: generateSVG(nodes, connections, subgraphs) }}
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Mermaid Format</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(mermaidCode, "mermaid")}>
                    {copied === "mermaid" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied === "mermaid" ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(mermaidCode, "diagram.mmd", "text/plain")}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <pre className="p-3 rounded bg-muted text-xs overflow-auto max-h-48 font-mono">{mermaidCode}</pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">JSON Format</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(jsonCode, "json")}>
                    {copied === "json" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied === "json" ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(jsonCode, "diagram.json", "application/json")}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <pre className="p-3 rounded bg-muted text-xs overflow-auto max-h-48 font-mono">{jsonCode}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
