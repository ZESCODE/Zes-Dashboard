"use client"

import { X } from "lucide-react"
import type { ThemeType } from "./terminal"
import { cn } from "@/lib/utils"

interface KeyboardShortcutsProps {
  onClose: () => void
  theme: ThemeType
}

export default function KeyboardShortcuts({ onClose, theme }: KeyboardShortcutsProps) {
  const shortcuts = [
    { keys: ["Ctrl", "B"], description: "Toggle file browser" },
    { keys: ["Ctrl", "\\"], description: "Toggle split view" },
    { keys: ["Ctrl", "T"], description: "Open theme selector" },
    { keys: ["Ctrl", "K"], description: "Show keyboard shortcuts" },
    { keys: ["Up", "Down"], description: "Navigate command history" },
    { keys: ["Tab"], description: "Autocomplete command" },
    { keys: ["Ctrl", "C"], description: "Cancel current command" },
    { keys: ["Ctrl", "L"], description: "Clear terminal (or type 'clear')" },
    { keys: ["Ctrl", "R"], description: "Search command history" },
    { keys: ["Ctrl", "D"], description: "Exit current session" },
  ]

  const getContainerClasses = () => {
    switch (theme) {
      case "purple":
        return "border-purple-800 bg-[#15101e] shadow-purple-900/20"
      case "ocean":
        return "border-blue-800 bg-[#0a1525] shadow-blue-900/20"
      case "midnight":
        return "border-gray-700 bg-[#0d0e15] shadow-black/20"
      case "darker":
        return "border-gray-800 bg-black shadow-black/20"
      default:
        return "border-gray-800 bg-gray-900 shadow-black/20"
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn("w-96 rounded-lg border p-4 shadow-xl", getContainerClasses())}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span
                    key={keyIndex}
                    className="inline-flex items-center justify-center rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-medium"
                  >
                    {key}
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-400">{shortcut.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
