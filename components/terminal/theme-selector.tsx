"use client"

import { X } from "lucide-react"
import type { ThemeType } from "./terminal"
import { cn } from "@/lib/utils"

interface ThemeSelectorProps {
  currentTheme: ThemeType
  onThemeChange: (theme: ThemeType) => void
  onClose: () => void
}

export default function ThemeSelector({ currentTheme, onThemeChange, onClose }: ThemeSelectorProps) {
  const themes: { name: string; value: ThemeType; color: string }[] = [
    { name: "Dark", value: "dark", color: "bg-gray-950" },
    { name: "Darker", value: "darker", color: "bg-black" },
    { name: "Midnight", value: "midnight", color: "bg-[#0f101a]" },
    { name: "Purple", value: "purple", color: "bg-[#1a1025]" },
    { name: "Ocean", value: "ocean", color: "bg-[#0a192f]" },
  ]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-80 rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Select Theme</h3>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-2">
          {themes.map((theme) => (
            <button
              key={theme.value}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-gray-800",
                currentTheme === theme.value && "bg-gray-800",
              )}
              onClick={() => onThemeChange(theme.value)}
            >
              <div className={cn("h-5 w-5 rounded-full border border-gray-600", theme.color)} />
              <span>{theme.name}</span>
              {currentTheme === theme.value && <span className="ml-auto text-xs text-green-400">Active</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
