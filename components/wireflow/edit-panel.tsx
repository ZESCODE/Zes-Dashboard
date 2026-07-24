"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Trash2 } from "lucide-react"

interface Node {
  id: string
  label: string
  sublabel?: string
  type: "atem" | "pc" | "device" | "converter" | "cloud" | "stream"
  x: number
  y: number
  system: string
}

interface Connection {
  from: string
  to: string
  label?: string
  type: "hdmi" | "sdi" | "usb" | "wireless" | "ethernet" | "stream" | "audio"
  lineStyle?: "solid" | "dotted" | "thick"
}

interface EditPanelProps {
  nodes: Node[]
  connections: Connection[]
  selectedNodeId: string | null
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void
  onDeleteNode: (nodeId: string) => void
  onAddNode: (node: Node) => void
  onUpdateConnection: (index: number, updates: Partial<Connection>) => void
  onDeleteConnection: (index: number) => void
  onAddConnection: (connection: Connection) => void
  onClose: () => void
}

export function EditPanel({
  nodes,
  connections,
  selectedNodeId,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
  onUpdateConnection,
  onDeleteConnection,
  onAddConnection,
  onClose,
}: EditPanelProps) {
  const [activeTab, setActiveTab] = useState<"node" | "connection" | "add">("node")
  const [newNodeId, setNewNodeId] = useState("")
  const [newNodeLabel, setNewNodeLabel] = useState("")
  const [newNodeType, setNewNodeType] = useState<Node["type"]>("device")
  const [newNodeSystem, setNewNodeSystem] = useState<Node["system"]>("main")
  const [newConnFrom, setNewConnFrom] = useState("")
  const [newConnTo, setNewConnTo] = useState("")
  const [newConnLabel, setNewConnLabel] = useState("")
  const [newConnType, setNewConnType] = useState<Connection["type"]>("hdmi")

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handleAddNode = () => {
    if (!newNodeId || !newNodeLabel) return
    onAddNode({
      id: newNodeId,
      label: newNodeLabel,
      type: newNodeType,
      system: newNodeSystem,
      x: 100,
      y: 100,
    })
    setNewNodeId("")
    setNewNodeLabel("")
  }

  const handleAddConnection = () => {
    if (!newConnFrom || !newConnTo) return
    onAddConnection({
      from: newConnFrom,
      to: newConnTo,
      label: newConnLabel || undefined,
      type: newConnType,
    })
    setNewConnFrom("")
    setNewConnTo("")
    setNewConnLabel("")
  }

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-auto sm:top-24 w-full sm:w-80 bg-background/95 backdrop-blur border-t sm:border border-border sm:rounded-lg shadow-xl z-50 max-h-[70vh] sm:max-h-[calc(100vh-150px)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Edit Diagram</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex border-b border-border">
        <button
          className={`flex-1 px-3 py-2 text-sm ${activeTab === "node" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("node")}
        >
          Nodes
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm ${activeTab === "connection" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("connection")}
        >
          Connections
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm ${activeTab === "add" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("add")}
        >
          Add
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {activeTab === "node" && (
          <>
            {selectedNode ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Selected: <span className="text-foreground font-medium">{selectedNode.label}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={selectedNode.label}
                    onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sublabel</Label>
                  <Input
                    value={selectedNode.sublabel || ""}
                    onChange={(e) => onUpdateNode(selectedNode.id, { sublabel: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={selectedNode.type}
                    onValueChange={(v) => onUpdateNode(selectedNode.id, { type: v as Node["type"] })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atem">ATEM</SelectItem>
                      <SelectItem value="pc">PC</SelectItem>
                      <SelectItem value="device">Device</SelectItem>
                      <SelectItem value="converter">Converter</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="stream">Stream</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Group</Label>
                  <Select
                    value={selectedNode.system}
                    onValueChange={(v) => onUpdateNode(selectedNode.id, { system: v as Node["system"] })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="sub">Sub</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => onDeleteNode(selectedNode.id)}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete Node
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Click a node to select and edit it.</p>
                <div className="space-y-1 max-h-64 overflow-auto">
                  {nodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                      <span className="truncate">{node.label}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => onDeleteNode(node.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "connection" && (
          <div className="space-y-2 max-h-80 overflow-auto">
            {connections.map((conn, index) => (
              <div key={`${conn.from}-${conn.to}-${index}`} className="p-2 rounded bg-muted/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {nodes.find((n) => n.id === conn.from)?.label || conn.from} →{" "}
                    {nodes.find((n) => n.id === conn.to)?.label || conn.to}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => onDeleteConnection(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={conn.label || ""}
                    onChange={(e) => onUpdateConnection(index, { label: e.target.value })}
                    placeholder="Label"
                    className="h-7 text-xs flex-1"
                  />
                  <Select
                    value={conn.type}
                    onValueChange={(v) => onUpdateConnection(index, { type: v as Connection["type"] })}
                  >
                    <SelectTrigger className="h-7 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hdmi">HDMI</SelectItem>
                      <SelectItem value="sdi">SDI</SelectItem>
                      <SelectItem value="usb">USB</SelectItem>
                      <SelectItem value="wireless">Wireless</SelectItem>
                      <SelectItem value="ethernet">Ethernet</SelectItem>
                      <SelectItem value="stream">Stream</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "add" && (
          <div className="space-y-4">
            <div className="space-y-3 p-3 rounded bg-muted/30 border border-border">
              <h4 className="text-sm font-medium">Add Node</h4>
              <div className="space-y-2">
                <Input
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value.replace(/\s/g, "_"))}
                  placeholder="Node ID (unique)"
                  className="h-8 text-sm"
                />
                <Input
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  placeholder="Label"
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Select value={newNodeType} onValueChange={(v) => setNewNodeType(v as Node["type"])}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atem">ATEM</SelectItem>
                      <SelectItem value="pc">PC</SelectItem>
                      <SelectItem value="device">Device</SelectItem>
                      <SelectItem value="converter">Converter</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="stream">Stream</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newNodeSystem} onValueChange={(v) => setNewNodeSystem(v as Node["system"])}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="sub">Sub</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="w-full" onClick={handleAddNode} disabled={!newNodeId || !newNodeLabel}>
                  <Plus className="w-3 h-3 mr-2" />
                  Add Node
                </Button>
              </div>
            </div>

            <div className="space-y-3 p-3 rounded bg-muted/30 border border-border">
              <h4 className="text-sm font-medium">Add Connection</h4>
              <div className="space-y-2">
                <Select value={newConnFrom} onValueChange={setNewConnFrom}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="From node" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newConnTo} onValueChange={setNewConnTo}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="To node" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newConnLabel}
                  onChange={(e) => setNewConnLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="h-8 text-sm"
                />
                <Select value={newConnType} onValueChange={(v) => setNewConnType(v as Connection["type"])}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hdmi">HDMI</SelectItem>
                    <SelectItem value="sdi">SDI</SelectItem>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="wireless">Wireless</SelectItem>
                    <SelectItem value="ethernet">Ethernet</SelectItem>
                    <SelectItem value="stream">Stream</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleAddConnection}
                  disabled={!newConnFrom || !newConnTo}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Connection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
