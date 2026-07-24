"use client"

import type { ThemeType } from "./terminal"
import { cn } from "@/lib/utils"
import { Bot } from "lucide-react"

interface CommandSuggestionsProps {
  onSelect: (command: string) => void
  theme: ThemeType
}

export default function CommandSuggestions({ onSelect, theme }: CommandSuggestionsProps) {
  const suggestions = [
    { command: "git status", description: "Show the working tree status" },
    { command: "npm install", description: "Install package dependencies" },
    { command: "ls -la", description: "List directory contents with details" },
    { command: "docker ps", description: "List running containers" },
    { command: "theme", description: "Change terminal theme" },
    { command: "split", description: "Toggle split view" },
    { command: "files", description: "Open file browser" },
    { command: "shortcuts", description: "Show keyboard shortcuts" },
    { command: "clear", description: "Clear terminal output" },
    { command: "search", description: "Search in command history" },
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

  const getItemHoverClasses = () => {
    switch (theme) {
      case "purple":
        return "hover:bg-purple-800/50"
      case "ocean":
        return "hover:bg-blue-800/50"
      case "midnight":
        return "hover:bg-gray-800/50"
      default:
        return "hover:bg-gray-800"
    }
  }

  const getCommandColor = () => {
    switch (theme) {
      case "purple":
        return "text-purple-400"
      case "ocean":
        return "text-blue-400"
      default:
        return "text-purple-400"
    }
  }

  const getBorderColor = () => {
    switch (theme) {
      case "purple":
        return "border-purple-800/50"
      case "ocean":
        return "border-blue-800/50"
      case "midnight":
        return "border-gray-700/50"
      default:
        return "border-gray-800/50"
    }
  }

  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border shadow-lg",
        getContainerClasses(),
      )}
    >
      <div className={cn("flex items-center gap-2 border-b p-2 text-xs", getBorderColor())}>
        <Bot className="h-4 w-4" />
        <span>AI Command Assistant</span>
      </div>
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={cn(
            "flex cursor-pointer items-center justify-between border-b px-3 py-2 text-sm",
            getBorderColor(),
            getItemHoverClasses(),
          )}
          onClick={() => onSelect(suggestion.command)}
        >
          <span className={cn("font-medium", getCommandColor())}>{suggestion.command}</span>
          <span className="text-xs text-gray-400">{suggestion.description}</span>
        </div>
      ))}
    </div>
  )
}
