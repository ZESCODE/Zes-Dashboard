import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"

interface SplitPaneProps {
  children: ReactNode[]
  theme: ThemeType
}

export default function SplitPane({ children, theme }: SplitPaneProps) {
  const getBorderColor = () => {
    switch (theme) {
      case "purple":
        return "border-purple-800"
      case "ocean":
        return "border-blue-800"
      case "midnight":
        return "border-gray-700"
      default:
        return "border-gray-800"
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {children[0]}
      <div
        className={cn("shrink-0 border-t", getBorderColor())}
        style={{ boxShadow: "0 0 8px rgba(56,160,255,0.15)" }}
      />
      {children[1]}
    </div>
  )
}
