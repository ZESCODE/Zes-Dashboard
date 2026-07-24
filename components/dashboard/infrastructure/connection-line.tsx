"use client"

import { useId } from "react"

interface ConnectionLineProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  label?: string
  type: "hdmi" | "sdi" | "usb" | "wireless" | "ethernet" | "stream" | "audio"
  lineStyle?: "solid" | "dotted" | "thick"
  isHighlighted: boolean
}

const typeColors = {
  hdmi: { stroke: "#22d3ee", glow: "#22d3ee" },
  sdi: { stroke: "#fb923c", glow: "#fb923c" },
  usb: { stroke: "#4ade80", glow: "#4ade80" },
  wireless: { stroke: "#f472b6", glow: "#f472b6" },
  ethernet: { stroke: "#facc15", glow: "#facc15" },
  stream: { stroke: "#a78bfa", glow: "#a78bfa" },
  audio: { stroke: "#f87171", glow: "#f87171" },
}

export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  label,
  type,
  lineStyle = "solid",
  isHighlighted,
}: ConnectionLineProps) {
  const filterId = useId()
  const { stroke, glow } = typeColors[type]

  const baseStrokeWidth = lineStyle === "thick" ? 4 : 2
  const highlightedStrokeWidth = lineStyle === "thick" ? 5 : 3

  const getDashArray = () => {
    if (lineStyle === "dotted") return "4 4"
    if (type === "wireless") return "8 4"
    return undefined
  }

  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2
  const dx = toX - fromX

  const cx1 = fromX + dx * 0.25
  const cy1 = fromY
  const cx2 = toX - dx * 0.25
  const cy2 = toY

  const pathD = `M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`

  return (
    <g className="transition-opacity duration-300" style={{ opacity: isHighlighted ? 1 : 0.3 }}>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {isHighlighted && (
        <path
          d={pathD}
          fill="none"
          stroke={glow}
          strokeWidth="6"
          strokeOpacity="0.3"
          filter={`url(#${filterId})`}
        />
      )}

      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={isHighlighted ? highlightedStrokeWidth : baseStrokeWidth}
        strokeDasharray={isHighlighted ? (getDashArray() || "20 20") : getDashArray()}
      />

      {isHighlighted && (
        <circle r="4" fill={stroke}>
          <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
        </circle>
      )}

      {label && (
        <g transform={`translate(${midX}, ${midY - 8})`}>
          <rect
            x="-35"
            y="-10"
            width="70"
            height="18"
            rx="4"
            fill="rgba(0,0,0,0.7)"
            stroke={isHighlighted ? stroke : "transparent"}
            strokeWidth="1"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isHighlighted ? stroke : "#888"}
            fontSize="9"
            fontFamily="var(--font-mono)"
            className="select-none"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}
