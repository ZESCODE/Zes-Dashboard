"use client"

import { useState, type KeyboardEvent, useRef, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"

interface CommandInputProps {
  onSubmit: (command: string) => void
  onFocus?: () => void
  onBlur?: () => void
  commandHistory: string[]
  theme: ThemeType
}

export default function CommandInput({ onSubmit, onFocus, onBlur, commandHistory, theme }: CommandInputProps) {
  const [command, setCommand] = useState("")
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && command.trim()) {
      onSubmit(command.trim())
      setCommand("")
      setHistoryIndex(-1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || "")
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || "")
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand("")
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      // Simple tab completion for demo purposes
      if (command.startsWith("g")) {
        setCommand("git ")
      } else if (command.startsWith("n")) {
        setCommand("npm ")
      } else if (command.startsWith("c")) {
        setCommand("cd ")
      }
    }
  }

  // Auto-focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const getThemeClasses = () => {
    switch (theme) {
      case "purple":
        return "bg-purple-900/30 text-purple-100"
      case "ocean":
        return "bg-blue-900/30 text-blue-100"
      case "midnight":
        return "bg-[#161827]/50 text-gray-200"
      case "darker":
        return "bg-gray-900/30 text-gray-200"
      default:
        return "bg-gray-900/50 text-gray-200"
    }
  }

  const getPromptColor = () => {
    switch (theme) {
      case "purple":
        return "text-purple-400"
      case "ocean":
        return "text-blue-400"
      default:
        return "text-green-400"
    }
  }

  return (
    <div className={cn("flex items-center gap-2 rounded-md px-3 py-2", getThemeClasses())}>
      <ChevronRight className={cn("h-4 w-4", getPromptColor())} />
      <input
        ref={inputRef}
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className="flex-1 bg-transparent outline-none"
        placeholder="Type a command..."
        autoFocus
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  )
}
