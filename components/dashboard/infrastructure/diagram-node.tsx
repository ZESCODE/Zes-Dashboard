"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Monitor, Laptop, Server, Radio, Cloud, Tv, GripVertical } from "lucide-react"

interface DiagramNodeProps {
  id: string
  label: string
  sublabel?: string
  type: "atem" | "pc" | "device" | "converter" | "cloud" | "stream"
  x: number
  y: number
  system: string
  isSelected: boolean
  isConnected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovered: boolean) => void
  onDrag: (nodeId: string, x: number, y: number) => void
}

const typeConfig = {
  atem: {
    icon: Server,
    className: "border-primary bg-primary/10 text-primary shadow-primary/20",
    glowColor: "shadow-primary/50",
  },
  pc: {
    icon: Laptop,
    className: "border-cyan-500/50 bg-cyan-500/5 text-cyan-400 shadow-cyan-500/20",
    glowColor: "shadow-cyan-500/50",
  },
  device: {
    icon: Monitor,
    className: "border-zinc-500/50 bg-zinc-500/5 text-zinc-400 shadow-zinc-500/20",
    glowColor: "shadow-zinc-500/50",
  },
  converter: {
    icon: Radio,
    className: "border-dashed border-orange-500/50 bg-orange-500/5 text-orange-400 shadow-orange-500/20",
    glowColor: "shadow-orange-500/50",
  },
  cloud: {
    icon: Cloud,
    className: "border-red-500/50 bg-red-500/5 text-red-400 shadow-red-500/20",
    glowColor: "shadow-red-500/50",
  },
  stream: {
    icon: Tv,
    className: "border-green-500/50 bg-green-500/5 text-green-400 shadow-green-500/20",
    glowColor: "shadow-green-500/50",
  },
}

export function DiagramNode({
  id,
  label,
  sublabel,
  type,
  x,
  y,
  isSelected,
  isConnected,
  isHovered,
  onSelect,
  onHover,
  onDrag,
}: DiagramNodeProps) {
  const config = typeConfig[type]
  const Icon = config.icon
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragOffset.current = { x: e.clientX - x, y: e.clientY - y }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    setIsDragging(true)
    dragOffset.current = { x: touch.clientX - x, y: touch.clientY - y }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      onDrag(id, Math.max(0, e.clientX - dragOffset.current.x), Math.max(0, e.clientY - dragOffset.current.y))
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      onDrag(id, Math.max(0, touch.clientX - dragOffset.current.x), Math.max(0, touch.clientY - dragOffset.current.y))
    }

    const handleUp = () => setIsDragging(false)

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleUp)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleUp)
    }
  }, [isDragging, id, onDrag])

  const dimmed = !isSelected && !isConnected && !isHovered

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute transition-all duration-200 ease-out select-none w-[120px]",
        isDragging ? "cursor-grabbing z-50 transition-none" : "cursor-grab",
        dimmed && "opacity-30",
      )}
      style={{ left: x, top: y }}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation()
          onSelect()
        }
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        className={cn(
          "rounded-lg border p-2 shadow-lg transition-all duration-200",
          config.className,
          isSelected && `ring-2 ring-primary shadow-xl ${config.glowColor}`,
          isHovered && `shadow-xl ${config.glowColor}`,
          isConnected && "opacity-100",
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <GripVertical className="w-2.5 h-2.5 opacity-30 shrink-0" />
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] font-bold font-mono truncate leading-tight">{label}</span>
        </div>
        {sublabel && (
          <div className="text-[8px] text-muted-foreground font-mono leading-tight opacity-70 pl-4 truncate">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
