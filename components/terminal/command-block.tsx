"use client"

import { CheckCircle, AlertCircle, Info, AlertTriangle, ExternalLink, Copy } from "lucide-react"
import type { CommandType, ThemeType } from "./terminal"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface CommandBlockProps {
  command: CommandType
  theme: ThemeType
}

export default function CommandBlock({ command, theme }: CommandBlockProps) {
  const [copied, setCopied] = useState(false)

  const statusIcons = {
    success: <CheckCircle className="h-4 w-4 text-green-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command.command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getBlockClasses = () => {
    switch (theme) {
      case "purple":
        return "border-purple-800 bg-purple-900/20"
      case "ocean":
        return "border-blue-800 bg-blue-900/20"
      case "midnight":
        return "border-gray-700 bg-[#161827]/50"
      case "darker":
        return "border-gray-800 bg-gray-900/30"
      default:
        return "border-gray-800 bg-gray-900/50"
    }
  }

  const getHeaderClasses = () => {
    switch (theme) {
      case "purple":
        return "border-purple-800 bg-purple-900/40"
      case "ocean":
        return "border-blue-800 bg-blue-900/40"
      case "midnight":
        return "border-gray-700 bg-[#161827]"
      case "darker":
        return "border-gray-800 bg-gray-900/60"
      default:
        return "border-gray-800 bg-gray-900"
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
    <div className={cn("mb-4 overflow-hidden rounded-md border", getBlockClasses())}>
      <div className={cn("flex items-center gap-2 border-b px-3 py-2", getHeaderClasses())}>
        <div className="flex items-center gap-2">
          <span className={getPromptColor()}>$</span>
          <span className="font-semibold">{command.command}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <button onClick={copyToClipboard} className="rounded p-1 hover:bg-gray-700" title="Copy command">
            {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {statusIcons[command.status]}
          <span>{command.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
      {command.inlinePreview && (
        <div
          className={cn(
            "flex items-center gap-2 border-b px-3 py-1.5 text-xs",
            theme === "purple"
              ? "border-purple-800 bg-purple-900/30 text-purple-200"
              : theme === "ocean"
                ? "border-blue-800 bg-blue-900/30 text-blue-200"
                : "border-gray-800 bg-gray-800/50 text-gray-300",
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {command.inlinePreview}
        </div>
      )}
      {command.output && (
        <div
          className={cn(
            "whitespace-pre-wrap p-3 font-mono text-sm",
            command.status === "error" && "text-red-300",
            command.status === "warning" && "text-yellow-300",
          )}
        >
          {command.output}
        </div>
      )}
    </div>
  )
}
