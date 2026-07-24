export interface ParsedNode {
  id: string
  label: string
  sublabel?: string
  type: "atem" | "pc" | "device" | "converter" | "cloud" | "stream"
  system: string // e.g., "main", "sub", "control", "external", etc.
}

export interface ParsedConnection {
  from: string
  to: string
  label?: string
  type: "hdmi" | "sdi" | "usb" | "wireless" | "ethernet" | "stream" | "audio"
  lineStyle?: "solid" | "dotted" | "thick"
}

export interface ParsedDiagram {
  nodes: Map<string, ParsedNode>
  connections: ParsedConnection[]
  subgraphs: { id: string; title: string; nodeIds: string[] }[]
}

function inferNodeType(id: string, label: string, className?: string): ParsedNode["type"] {
  const lowerLabel = label.toLowerCase()
  const lowerId = id.toLowerCase()

  // Check classDef names first (hub, input, output, periph, misc)
  if (className) {
    const lowerClass = className.toLowerCase()
    if (lowerClass === "hub") return "atem" // Hub devices like ATEM, switches
    if (lowerClass === "input") return "pc" // Input sources
    if (lowerClass === "output") return "device" // Output devices
    if (lowerClass === "periph") return "device" // Peripherals
    if (lowerClass === "misc") return "converter" // Converters, misc devices
  }

  if (className?.includes("atem") || lowerLabel.includes("atem") || lowerLabel.includes("hermes") || lowerLabel.includes("codex") || lowerLabel.includes("orchestrat")) return "atem"
  if (className?.includes("pc") || lowerLabel.includes("pc ") || lowerId.includes("pc") || lowerLabel.includes("opencode") || lowerLabel.includes("user")) return "pc"
  if (className?.includes("cloud") || lowerLabel.includes("youtube") || lowerLabel.includes("live") || lowerLabel.includes("openai") || lowerLabel.includes("google") || lowerLabel.includes("anthropic") || lowerLabel.includes("groq") || lowerLabel.includes("mistral") || lowerLabel.includes("nvidia") || lowerLabel.includes("openrouter")) return "cloud"
  if (className?.includes("stream") || lowerLabel.includes("stream") || lowerLabel.includes("router") || lowerLabel.includes("proxy") || lowerLabel.includes("bitrouter") || lowerLabel.includes("ai-proxy")) return "stream"
  if (
    className?.includes("converter") ||
    lowerLabel.includes("converter") ||
    lowerLabel.includes("bidi") ||
    lowerLabel.includes("sdi to") ||
    lowerLabel.includes("bidirectional")
  )
    return "converter"
  return "device"
}

function inferConnectionType(label?: string, fromId?: string, toId?: string): ParsedConnection["type"] {
  if (!label) {
    const ids = `${fromId} ${toId}`.toLowerCase()
    if (ids.includes("youtube") || ids.includes("stream")) return "stream"
    return "hdmi"
  }

  const lowerLabel = label.toLowerCase()
  if (lowerLabel.includes("wireless")) return "wireless"
  if (lowerLabel.includes("sdi")) return "sdi"
  if (lowerLabel.includes("usb") || lowerLabel.includes("type-c")) return "usb"
  if (lowerLabel.includes("ethernet") || lowerLabel.includes("lan")) return "ethernet"
  if (lowerLabel.includes("stream")) return "stream"
  if (lowerLabel.includes("audio") || lowerLabel.includes("aux") || lowerLabel.includes("3.5mm") || lowerLabel.includes("line") || lowerLabel.includes("xlr") || lowerLabel.includes("trs") || lowerLabel.includes("rca")) return "audio"
  return "hdmi"
}

function inferLineStyle(arrow: string): ParsedConnection["lineStyle"] {
  // Thick lines: == or ===
  if (arrow.includes("==") || arrow.includes("===")) return "thick"
  // Dotted lines: -.- or -.->
  if (arrow.includes("-.") || arrow.includes(".-")) return "dotted"
  // Default solid
  return "solid"
}

// Parse a chain of connections like: A -- label --> B -. label2 .-> C
function parseChainConnections(line: string): Array<{ from: string; arrow: string; to: string }> {
  const results: Array<{ from: string; arrow: string; to: string }> = []
  
  // More comprehensive arrow patterns - order matters (longer patterns first)
  const arrowPatterns = [
    // Thick lines with quoted labels containing any chars (including <br>)
    /==\s*"[^"]+"\s*===/,
    /==\s*"[^"]+"\s*==/,
    // Thick lines with simple labels
    /==\s+[^=\s][^=]*?\s*===/,
    /==\s+[^=\s][^=]*?\s*==/,
    // Dotted lines with quoted labels
    /-\.\s*"[^"]+"\s*\.->/,
    // Dotted lines with simple labels
    /-\.\s+[^.\s][^.]*?\s*\.->/,
    // Standard lines with quoted labels
    /--\s*"[^"]+"\s*-->/,
    // Standard lines with simple labels (word characters only to avoid matching node definitions)
    /--\s+[^-\s"][^-]*?\s*-->/,
    // Simple arrows
    /-->/,
    /---/,
    /-\.->/,
    /===>/,
    /==>/,
    /===/,
    /==/,
  ]
  
  // Build a combined regex to find arrow positions
  const combinedPattern = new RegExp(
    arrowPatterns.map(p => `(${p.source})`).join('|'),
    'g'
  )
  
  // Find all arrows in the line
  const arrows: Array<{ match: string; index: number; length: number }> = []
  let match
  while ((match = combinedPattern.exec(line)) !== null) {
    arrows.push({ match: match[0], index: match.index, length: match[0].length })
  }
  
  if (arrows.length === 0) return results
  
  // Build connections from the found arrows
  let lastEnd = 0
  for (let i = 0; i < arrows.length; i++) {
    const arrow = arrows[i]
    const fromPart = line.substring(lastEnd, arrow.index).trim()
    
    // Find the "to" part: from end of arrow to start of next arrow (or end of line)
    const afterArrow = arrow.index + arrow.length
    let toPart: string
    
    if (i + 1 < arrows.length) {
      toPart = line.substring(afterArrow, arrows[i + 1].index).trim()
    } else {
      toPart = line.substring(afterArrow).trim()
    }
    
    if (fromPart && toPart) {
      results.push({ from: fromPart, arrow: arrow.match, to: toPart })
    }
    
    lastEnd = afterArrow
  }
  
  return results
}

function parseNodeLabel(rawLabel: string): { label: string; sublabel?: string } {
  // Handle different label formats: [Label], (Label), ((Label)), Label
  const cleaned = rawLabel
    .replace(/^\[\[/, "")
    .replace(/\]\]$/, "")
    .replace(/^\[$$/, "")
    .replace(/$$\]$/, "")
    .replace(/^$$\(/, "")
    .replace(/$$\)$/, "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/^$$/, "")
    .replace(/$$$/, "")
    .replace(/<br>/gi, "\n")
    .replace(/<br\/>/gi, "\n")
    .trim()

  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length >= 2) {
    return { label: lines[0], sublabel: lines.slice(1).join(" ") }
  }
  return { label: cleaned }
}

export function parseMermaid(mermaidCode: string): ParsedDiagram & { nodes: ParsedNode[] } {
  const nodes: Map<string, ParsedNode> = new Map()
  const connections: ParsedConnection[] = []
  const subgraphs: { id: string; title: string; nodeIds: string[] }[] = []

  // Remove config block and comments
  const cleanedCode = mermaidCode.replace(/%%\{[\s\S]*?\}%%/g, "").replace(/%%.*/g, "")

  const lines = cleanedCode
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  let currentSubgraph: { id: string; title: string; nodeIds: string[] } | null = null
  const subgraphStack: { id: string; title: string; nodeIds: string[] }[] = []

  // Track class definitions
  const classStyles: Map<string, string> = new Map()

  const ensureNode = (id: string, system: ParsedNode["system"] = "external") => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        label: id,
        type: inferNodeType(id, id),
        system,
      })
    }
    return nodes.get(id)!
  }

  const getCurrentSystem = (): string => {
    // Return the outermost (first) subgraph in the stack, or current subgraph
    if (subgraphStack.length > 0) {
      return subgraphStack[0].id
    }
    if (!currentSubgraph) return "external"
    return currentSubgraph.id
  }

  for (const line of lines) {
    // Skip graph declaration
    if (line.match(/^graph\s+(LR|RL|TB|BT|TD)/i)) continue

    // Parse classDef
    const classDefMatch = line.match(/classDef\s+(\w+)\s+(.+)/)
    if (classDefMatch) {
      classStyles.set(classDefMatch[1], classDefMatch[2])
      continue
    }

    // Parse subgraph start
    if (line.match(/^subgraph\s+/)) {
      if (currentSubgraph) {
        subgraphStack.push(currentSubgraph)
      }
      const match = line.match(/subgraph\s+(\w+)\s*\["?([^"\]]+)"?\]?/) || line.match(/subgraph\s+"?([^"]+)"?/)
      if (match) {
        currentSubgraph = {
          id: match[1],
          title: match[2] || match[1],
          nodeIds: [],
        }
      }
      continue
    }

    // Parse subgraph end
    if (line === "end") {
      if (currentSubgraph) {
        // Only push top-level subgraphs (when stack is empty or has only 1 level)
        // Nested subgraphs merge their nodes into parent
        if (subgraphStack.length === 0) {
          subgraphs.push(currentSubgraph)
        } else {
          // Merge nested subgraph nodes into parent
          const parent = subgraphStack[subgraphStack.length - 1]
          for (const nodeId of currentSubgraph.nodeIds) {
            if (!parent.nodeIds.includes(nodeId)) {
              parent.nodeIds.push(nodeId)
            }
          }
        }
        currentSubgraph = subgraphStack.pop() || null
      }
      continue
    }

    // Skip direction declarations
    if (line.match(/^direction\s+(TB|BT|LR|RL)/i)) continue

    // Pattern: NodeDef --> NodeDef or NodeDef -- "label" --> NodeDef
    // Where NodeDef can be: ID, ID[Label], ID(Label), ID((Label)), etc.
    // Also supports: == "label" === (thick), -. text .-> (dotted)
    // Also supports chain connections: A --> B --> C or A -- label --> B -. label2 .-> C

    // Check if this line contains any connection arrows
    const hasConnection = /-->|---|==|===|-\./.test(line)
    
    if (hasConnection) {
      // Parse chain connections (handles both single and multiple connections in one line)
      const chainConnections = parseChainConnections(line)
      
      if (chainConnections.length > 0) {
        const system = getCurrentSystem()
        
        for (const conn of chainConnections) {
          let arrow = conn.arrow.trim()
          let label: string | undefined
          const lineStyle = inferLineStyle(arrow)

          // Extract label from arrow if present
          // Handle --> |label| format
          const arrowLabelMatch = arrow.match(/-->\|([^|]+)\|/)
          if (arrowLabelMatch) {
            label = arrowLabelMatch[1].trim()
            arrow = "-->"
          }
          // Handle -- "label" --> format (label can contain any chars including <br>)
          const quotedLabelMatch = arrow.match(/--\s*"(.+?)"\s*-->/)
          if (quotedLabelMatch) {
            label = quotedLabelMatch[1].trim()
            arrow = "-->"
          }
          // Handle -- label --> format (without quotes, word chars only)
          const simpleLabelMatch = arrow.match(/--\s+([^-"]+?)\s*-->/)
          if (simpleLabelMatch && !quotedLabelMatch) {
            label = simpleLabelMatch[1].trim()
            arrow = "-->"
          }
          // Handle == "label" === format (thick lines, label can contain any chars)
          const thickQuotedLabelMatch = arrow.match(/==\s*"(.+?)"\s*===?/)
          if (thickQuotedLabelMatch) {
            label = thickQuotedLabelMatch[1].trim()
            arrow = "==="
          }
          // Handle == label === format (thick lines without quotes)
          const thickSimpleLabelMatch = arrow.match(/==\s+([^="]+?)\s*===?/)
          if (thickSimpleLabelMatch && !thickQuotedLabelMatch) {
            label = thickSimpleLabelMatch[1].trim()
            arrow = "==="
          }
          // Handle -. "text" .-> format (dotted lines)
          const dottedQuotedLabelMatch = arrow.match(/-\.\s*"(.+?)"\s*\.->/)
          if (dottedQuotedLabelMatch) {
            label = dottedQuotedLabelMatch[1].trim()
            arrow = "-.->"
          }
          // Handle -. text .-> format (dotted lines without quotes)
          const dottedSimpleLabelMatch = arrow.match(/-\.\s+([^."]+?)\s*\.->/)
          if (dottedSimpleLabelMatch && !dottedQuotedLabelMatch) {
            label = dottedSimpleLabelMatch[1].trim()
            arrow = "-.->"
          }

          // Parse from node (may have inline definition)
          const fromNodeDef = parseInlineNode(conn.from)
          const toNodeDef = parseInlineNode(conn.to)

          // Add/update from node
          if (fromNodeDef) {
            const existing = nodes.get(fromNodeDef.id)
            if (!existing) {
              nodes.set(fromNodeDef.id, { ...fromNodeDef, system })
            } else if (fromNodeDef.label !== fromNodeDef.id) {
              // Update label if we got a better one
              existing.label = fromNodeDef.label
              if (fromNodeDef.sublabel) existing.sublabel = fromNodeDef.sublabel
            }
            if (currentSubgraph && !currentSubgraph.nodeIds.includes(fromNodeDef.id)) {
              currentSubgraph.nodeIds.push(fromNodeDef.id)
            }
          }

          // Add/update to node
          if (toNodeDef) {
            const existing = nodes.get(toNodeDef.id)
            if (!existing) {
              nodes.set(toNodeDef.id, { ...toNodeDef, system })
            } else if (toNodeDef.label !== toNodeDef.id) {
              existing.label = toNodeDef.label
              if (toNodeDef.sublabel) existing.sublabel = toNodeDef.sublabel
            }
            if (currentSubgraph && !currentSubgraph.nodeIds.includes(toNodeDef.id)) {
              currentSubgraph.nodeIds.push(toNodeDef.id)
            }
          }

          // Add connection
          if (fromNodeDef && toNodeDef) {
            connections.push({
              from: fromNodeDef.id,
              to: toNodeDef.id,
              label: label?.replace(/[<>]/g, "").trim(),
              type: inferConnectionType(label, fromNodeDef.id, toNodeDef.id),
              lineStyle,
            })
          }
        }
        continue
      }
    }

    // Parse standalone node definitions: NodeId[Label], NodeId(Label), etc.
    const nodeOnlyDef = parseInlineNode(line)
    if (nodeOnlyDef && !line.includes("-->") && !line.includes("---")) {
      const system = getCurrentSystem()
      const existing = nodes.get(nodeOnlyDef.id)
      if (!existing) {
        nodes.set(nodeOnlyDef.id, { ...nodeOnlyDef, system })
      } else {
        existing.label = nodeOnlyDef.label
        if (nodeOnlyDef.sublabel) existing.sublabel = nodeOnlyDef.sublabel
      }
      if (currentSubgraph && !currentSubgraph.nodeIds.includes(nodeOnlyDef.id)) {
        currentSubgraph.nodeIds.push(nodeOnlyDef.id)
      }
    }
  }

  // Assign systems based on subgraphs for any nodes that weren't assigned
  // (This should already be handled by getCurrentSystem, but just in case)
  for (const subgraph of subgraphs) {
    for (const nodeId of subgraph.nodeIds) {
      const node = nodes.get(nodeId)
      if (node && node.system === "external") {
        node.system = subgraph.id
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    connections,
    subgraphs,
  }
}

function parseInlineNode(text: string): ParsedNode | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  // Remove class suffix (:::className)
  const withoutClass = trimmed.replace(/:::[\w-]+$/, "").trim()

  // Try various patterns
  const patterns = [
    // ((Label)) - stadium/pill shape
    /^(\w+)$$\((.+)$$\)$/,
    // [(Label)] - subroutine
    /^(\w+)\[$$(.+)$$\]$/,
    // [[Label]] - special
    /^(\w+)\[\[(.+)\]\]$/,
    // [Label] - rectangle
    /^(\w+)\[(.+)\]$/,
    // (Label) - rounded
    /^(\w+)$$(.+)$$$/,
    // {Label} - diamond
    /^(\w+)\{(.+)\}$/,
    // Just ID
    /^(\w+)$/,
  ]

  for (const pattern of patterns) {
    const match = withoutClass.match(pattern)
    if (match) {
      const id = match[1]
      const rawLabel = match[2] || match[1]
      const { label, sublabel } = parseNodeLabel(rawLabel)

      return {
        id,
        label,
        sublabel,
        type: inferNodeType(id, label),
        system: "external",
      }
    }
  }

  return null
}

export function calculateNodePositions(diagram: ParsedDiagram): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  // Group nodes by their system (subgraph id)
  const nodesBySystem = new Map<string, typeof diagram.nodes>()
  for (const node of diagram.nodes) {
    const systemNodes = nodesBySystem.get(node.system) || []
    systemNodes.push(node)
    nodesBySystem.set(node.system, systemNodes)
  }

  // Constants for layout
  const NODE_WIDTH = 140
  const NODE_HEIGHT = 80
  const NODE_GAP_X = 30
  const NODE_GAP_Y = 30
  const SYSTEM_GAP = 80
  const START_X = 60
  const START_Y = 100
  
  // Calculate columns needed per system (max 3 columns per system)
  const MAX_COLS = 3
  
  let currentX = START_X
  
  for (const subgraph of diagram.subgraphs) {
    const systemNodes = nodesBySystem.get(subgraph.id) || []
    if (systemNodes.length === 0) continue
    
    // Categorize nodes by type for better layout
    const hubNodes = systemNodes.filter(n => n.type === "atem")
    const inputNodes = systemNodes.filter(n => n.type === "pc" || n.type === "stream")
    const outputNodes = systemNodes.filter(n => n.type === "device" || n.type === "converter" || n.type === "cloud")
    const otherNodes = systemNodes.filter(n => 
      !hubNodes.includes(n) && !inputNodes.includes(n) && !outputNodes.includes(n)
    )
    
    // Determine layout based on node count
    const totalNodes = systemNodes.length
    const cols = Math.min(MAX_COLS, Math.ceil(Math.sqrt(totalNodes)))
    const rows = Math.ceil(totalNodes / cols)
    
    // If there's a hub (ATEM), use input -> hub -> output layout
    if (hubNodes.length > 0) {
      // Input column
      let col1X = currentX
      let y = START_Y
      for (const node of inputNodes) {
        positions.set(node.id, { x: col1X, y })
        y += NODE_HEIGHT + NODE_GAP_Y
      }
      for (const node of otherNodes.slice(0, Math.ceil(otherNodes.length / 2))) {
        positions.set(node.id, { x: col1X, y })
        y += NODE_HEIGHT + NODE_GAP_Y
      }
      
      // Hub column (center)
      let col2X = col1X + NODE_WIDTH + NODE_GAP_X
      y = START_Y + (rows * (NODE_HEIGHT + NODE_GAP_Y)) / 2 - NODE_HEIGHT / 2
      for (const node of hubNodes) {
        positions.set(node.id, { x: col2X, y })
        y += NODE_HEIGHT + NODE_GAP_Y
      }
      
      // Output column
      let col3X = col2X + NODE_WIDTH + NODE_GAP_X
      y = START_Y
      for (const node of outputNodes) {
        positions.set(node.id, { x: col3X, y })
        y += NODE_HEIGHT + NODE_GAP_Y
      }
      for (const node of otherNodes.slice(Math.ceil(otherNodes.length / 2))) {
        positions.set(node.id, { x: col3X, y })
        y += NODE_HEIGHT + NODE_GAP_Y
      }
      
      currentX = col3X + NODE_WIDTH + SYSTEM_GAP
    } else {
      // Grid layout for systems without hub
      let nodeIndex = 0
      for (let row = 0; row < rows && nodeIndex < systemNodes.length; row++) {
        for (let col = 0; col < cols && nodeIndex < systemNodes.length; col++) {
          const node = systemNodes[nodeIndex]
          const x = currentX + col * (NODE_WIDTH + NODE_GAP_X)
          const y = START_Y + row * (NODE_HEIGHT + NODE_GAP_Y)
          positions.set(node.id, { x, y })
          nodeIndex++
        }
      }
      
      currentX += cols * (NODE_WIDTH + NODE_GAP_X) + SYSTEM_GAP
    }
  }
  
  // Handle external nodes
  const externalNodes = diagram.nodes.filter((n) => n.system === "external")
  let extY = START_Y
  for (const node of externalNodes) {
    if (!positions.has(node.id)) {
      positions.set(node.id, { x: currentX, y: extY })
      extY += NODE_HEIGHT + NODE_GAP_Y
    }
  }

  return positions
}

export function calculateSubgraphBounds(
  diagram: ParsedDiagram,
  positions: Map<string, { x: number; y: number }>,
): { id: string; title: string; x: number; y: number; width: number; height: number }[] {
  const bounds: { id: string; title: string; x: number; y: number; width: number; height: number }[] = []

  const NODE_WIDTH = 120
  const NODE_HEIGHT = 70
  const PADDING = 30

  for (const subgraph of diagram.subgraphs) {
    const nodePositions = subgraph.nodeIds
      .map((id) => positions.get(id))
      .filter((pos): pos is { x: number; y: number } => pos !== undefined)

    if (nodePositions.length === 0) continue

    const minX = Math.min(...nodePositions.map((p) => p.x))
    const maxX = Math.max(...nodePositions.map((p) => p.x))
    const minY = Math.min(...nodePositions.map((p) => p.y))
    const maxY = Math.max(...nodePositions.map((p) => p.y))

    bounds.push({
      id: subgraph.id,
      title: subgraph.title,
      x: minX - PADDING,
      y: minY - PADDING - 20, // Extra space for header
      width: maxX - minX + NODE_WIDTH + PADDING * 2,
      height: maxY - minY + NODE_HEIGHT + PADDING * 2 + 20,
    })
  }

  return bounds
}
