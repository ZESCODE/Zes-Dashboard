"use client"

import { useEffect } from "react"
import {
  Code,
  FileText,
  FolderOpen,
  GitBranch,
  Home,
  Settings,
  Moon,
  Split,
  TerminalIcon,
  Search,
  Keyboard,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"

interface SidebarProps {
  theme: ThemeType
  onThemeToggle: () => void
  onFileBrowserToggle: () => void
  onSplitViewToggle: () => void
  onKeyboardShortcutsToggle: () => void
  showFileBrowser: boolean
  splitView: boolean
  /** Mobile drawer open state */
  open: boolean
  onClose: () => void
}

export default function Sidebar({
  theme,
  onThemeToggle,
  onFileBrowserToggle,
  onSplitViewToggle,
  onKeyboardShortcutsToggle,
  showFileBrowser,
  splitView,
  open,
  onClose,
}: SidebarProps) {
  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  const navItems = [
    { icon: Home, label: "Home", action: undefined },
    { icon: FolderOpen, label: "File Browser", action: onFileBrowserToggle, active: showFileBrowser },
    { icon: FileText, label: "Editor", action: undefined },
    { icon: GitBranch, label: "Git", action: undefined },
    { icon: TerminalIcon, label: "Terminal", action: undefined },
    { icon: Split, label: "Split View", action: onSplitViewToggle, active: splitView },
    { icon: Search, label: "Search", action: undefined },
  ]

  const bottomItems = [
    { icon: Keyboard, label: "Shortcuts", action: onKeyboardShortcutsToggle },
    { icon: Moon, label: "Theme", action: onThemeToggle },
    { icon: Settings, label: "Settings", action: undefined },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 flex flex-col transition-transform duration-300 ease-out",
          "glass-card glow-border",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: "rgba(4, 14, 45, 0.82)",
          borderRight: "1px solid rgba(56,160,255,0.35)",
          boxShadow: "4px 0 40px rgba(56,160,255,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-blue-500/20">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{
                background: "linear-gradient(135deg, rgba(56,160,255,0.8), rgba(20,80,200,0.9))",
                boxShadow: "0 0 12px rgba(56,160,255,0.5)",
              }}
            >
              <Code className="h-4 w-4 text-white" />
            </div>
            <span
              className="font-mono text-sm font-semibold tracking-widest text-blue-200 glow-text"
            >
              ZES TERMINAL
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-blue-400 hover:text-blue-200 hover:bg-blue-500/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-frost">
          <p className="px-3 pb-2 text-[10px] font-mono tracking-widest text-blue-500/60 uppercase">Navigation</p>
          <div className="flex flex-col gap-1">
            {navItems.map(({ icon: Icon, label, action, active }) => (
              <button
                key={label}
                onClick={() => {
                  action?.()
                  onClose()
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-mono transition-all duration-150",
                  active
                    ? "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                    : "text-blue-300/70 hover:bg-blue-500/10 hover:text-blue-200 border border-transparent",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <p className="mt-6 px-3 pb-2 text-[10px] font-mono tracking-widest text-blue-500/60 uppercase">System</p>
          <div className="flex flex-col gap-1">
            {bottomItems.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={() => {
                  action?.()
                  onClose()
                }}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-mono text-blue-300/70 hover:bg-blue-500/10 hover:text-blue-200 border border-transparent transition-all duration-150"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-blue-500/20 px-4 py-3">
          <p className="text-[10px] font-mono text-blue-500/50 tracking-wider">
            ZES v1.0.0 &bull; main
          </p>
        </div>
      </aside>
    </>
  )
}
