"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Menu, X, Terminal as TerminalIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import CommandInput from "./command-input"
import CommandBlock from "./command-block"
import Sidebar from "./sidebar-terminal"
import Tabs from "./tabs"
import CommandSuggestions from "./command-suggestions"
import ThemeSelector from "./theme-selector"
import FileBrowser from "./file-browser"
import KeyboardShortcuts from "./keyboard-shortcuts"
import SplitPane from "./split-pane"
import BottomNav from "./bottom-nav"

export type CommandType = {
  id: string
  command: string
  output: string
  timestamp: Date
  status: "success" | "error" | "warning" | "info"
  inlinePreview?: string
}

export type ThemeType = "dark" | "darker" | "midnight" | "purple" | "ocean"

export default function Terminal() {
  const [commands, setCommands] = useState<CommandType[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [theme, setTheme] = useState<ThemeType>("ocean")
  const [splitView, setSplitView] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  const addCommand = (command: string) => {
    setCommandHistory((prev) => [...prev, command])

    let output = ""
    let status: "success" | "error" | "warning" | "info" = "success"
    let inlinePreview: string | undefined = undefined

    if (command.startsWith("ls")) {
      output = "Documents  Downloads  Pictures  Music  Videos  Projects  .git  .config  package.json"
    } else if (command.startsWith("cd")) {
      output = ""
    } else if (command.startsWith("echo")) {
      output = command.substring(5)
    } else if (command.startsWith("cat")) {
      output =
        "File contents would appear here\nWith multiple lines\nAnd proper formatting\n# This is a heading\n\nfunction example() {\n  console.log('Hello world');\n}"
      inlinePreview = "Text file preview"
    } else if (command.startsWith("git")) {
      if (command.includes("status")) {
        output =
          "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"
      } else if (command.includes("log")) {
        output =
          "commit a1b2c3d4\nAuthor: Developer <dev@zes.io>\nDate:   Thu Jul 24 2026\n\n    Initial commit"
      } else {
        output = "git command executed"
      }
    } else if (command.startsWith("npm")) {
      if (command.includes("install")) {
        output =
          "added 1256 packages, and audited 1257 packages in 3s\n\n133 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities"
        inlinePreview = "Package installation complete"
      } else {
        output = "npm command executed successfully"
      }
    } else if (command === "help") {
      output = "Available commands: ls, cd, echo, cat, git, npm, clear, help, theme, split, files, shortcuts, search"
    } else if (command === "clear") {
      setCommands([])
      return
    } else if (command === "theme") {
      setShowThemeSelector(true)
      output = "Opening theme selector..."
    } else if (command === "split") {
      setSplitView(!splitView)
      output = splitView ? "Split view disabled" : "Split view enabled"
    } else if (command === "files") {
      setShowFileBrowser(true)
      output = "Opening file browser..."
    } else if (command === "shortcuts") {
      setShowKeyboardShortcuts(true)
      output = "Opening keyboard shortcuts..."
    } else if (command.startsWith("search")) {
      const term = command.substring(7).trim()
      if (term) {
        setSearchTerm(term)
        output = `Searching for "${term}" in command history...`
      } else {
        output = "Usage: search <term>"
        status = "warning"
      }
    } else {
      output = `Command not found: ${command}`
      status = "error"
    }

    const newCommand: CommandType = {
      id: Date.now().toString(),
      command,
      output,
      timestamp: new Date(),
      status,
      inlinePreview,
    }

    setCommands((prev) => [...prev, newCommand])
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  const filteredCommands = searchTerm
    ? commands.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.output.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : commands

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "k") {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      } else if (e.key === "b") {
        e.preventDefault()
        setShowFileBrowser(!showFileBrowser)
      } else if (e.key === "\\") {
        e.preventDefault()
        setSplitView(!splitView)
      } else if (e.key === "t") {
        e.preventDefault()
        setShowThemeSelector(true)
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showFileBrowser, splitView])

  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden md:h-[680px] md:max-w-5xl md:rounded-xl"
      style={{
        background: "rgba(4, 14, 45, 0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(56,160,255,0.3)",
        boxShadow:
          "0 0 0 1px rgba(56,160,255,0.15), 0 0 40px rgba(56,160,255,0.1), 0 8px 80px rgba(0,0,0,0.7)",
      }}
    >
      {/* Sidebar Drawer */}
      <Sidebar
        theme={theme}
        onThemeToggle={() => setShowThemeSelector(true)}
        onFileBrowserToggle={() => setShowFileBrowser(!showFileBrowser)}
        onSplitViewToggle={() => setSplitView(!splitView)}
        onKeyboardShortcutsToggle={() => setShowKeyboardShortcuts(true)}
        showFileBrowser={showFileBrowser}
        splitView={splitView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Top header bar */}
      <header
        className="flex shrink-0 items-center justify-between px-3 py-2 border-b"
        style={{
          background: "rgba(4, 14, 45, 0.9)",
          borderBottom: "1px solid rgba(56,160,255,0.2)",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-blue-400 hover:text-blue-200 hover:bg-blue-500/15 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-blue-400" style={{ filter: "drop-shadow(0 0 4px rgba(56,160,255,0.8))" }} />
          <span
            className="font-mono text-sm font-semibold tracking-widest text-blue-200"
            style={{ textShadow: "0 0 10px rgba(100,200,255,0.6)" }}
          >
            ZES SYSTEM
          </span>
        </div>

        {/* Traffic lights (decorative) */}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
      </header>

      {/* Tabs */}
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {showFileBrowser && (
          <FileBrowser theme={theme} onClose={() => setShowFileBrowser(false)} />
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          {splitView ? (
            <SplitPane theme={theme}>
              <div className="flex flex-1 flex-col overflow-hidden">
                <PaneHeader label="Terminal 1" index={1} />
                <TerminalContent
                  commands={filteredCommands.slice(0, Math.ceil(filteredCommands.length / 2))}
                  theme={theme}
                  terminalRef={terminalRef}
                  showSuggestions={showSuggestions}
                  setShowSuggestions={setShowSuggestions}
                  addCommand={addCommand}
                  commandHistory={commandHistory}
                  searchTerm={searchTerm}
                />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <PaneHeader label="Terminal 2" index={2} />
                <TerminalContent
                  commands={filteredCommands.slice(Math.ceil(filteredCommands.length / 2))}
                  theme={theme}
                  showSuggestions={showSuggestions}
                  setShowSuggestions={setShowSuggestions}
                  addCommand={addCommand}
                  commandHistory={commandHistory}
                  searchTerm={searchTerm}
                />
              </div>
            </SplitPane>
          ) : (
            <TerminalContent
              commands={filteredCommands}
              theme={theme}
              terminalRef={terminalRef}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              addCommand={addCommand}
              commandHistory={commandHistory}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar theme={theme} searchTerm={searchTerm} onClearSearch={() => setSearchTerm("")} />

      {/* Mobile bottom nav */}
      <BottomNav
        theme={theme}
        onThemeToggle={() => setShowThemeSelector(true)}
        onFileBrowserToggle={() => setShowFileBrowser(!showFileBrowser)}
        onSplitViewToggle={() => setSplitView(!splitView)}
        onKeyboardShortcutsToggle={() => setShowKeyboardShortcuts(true)}
        showFileBrowser={showFileBrowser}
        splitView={splitView}
      />

      {/* Overlays */}
      {showThemeSelector && (
        <ThemeSelector currentTheme={theme} onThemeChange={setTheme} onClose={() => setShowThemeSelector(false)} />
      )}
      {showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} theme={theme} />
      )}
    </div>
  )
}

// ─── TerminalContent ──────────────────────────────────────────────────────────

interface TerminalContentProps {
  commands: CommandType[]
  theme: ThemeType
  terminalRef?: React.RefObject<HTMLDivElement>
  showSuggestions: boolean
  setShowSuggestions: (show: boolean) => void
  addCommand: (command: string) => void
  commandHistory: string[]
  searchTerm: string
}

function TerminalContent({
  commands,
  theme,
  terminalRef,
  showSuggestions,
  setShowSuggestions,
  addCommand,
  commandHistory,
  searchTerm,
}: TerminalContentProps) {
  return (
    <div
      ref={terminalRef}
      className="flex-1 overflow-y-auto p-3 font-mono text-sm scrollbar-frost"
    >
      {searchTerm ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-blue-500/25 p-3 text-blue-300"
          style={{ background: "rgba(10,30,80,0.5)" }}>
          Showing results for: <span className="font-bold text-blue-200">{searchTerm}</span>
        </div>
      ) : (
        <div
          className="mb-4 rounded-md border p-3"
          style={{
            background: "rgba(10,30,80,0.45)",
            border: "1px solid rgba(56,160,255,0.22)",
            boxShadow: "0 0 16px rgba(56,160,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-mono font-bold tracking-[0.2em] text-blue-300"
              style={{ textShadow: "0 0 8px rgba(56,160,255,0.7)" }}
            >
              ZES SYSTEM TERMINAL
            </span>
          </div>
          <p className="text-[11px] text-blue-400/60 font-mono tracking-wider">
            Type <span className="text-blue-300">help</span> to see available commands.
          </p>
        </div>
      )}

      {commands.map((cmd) => (
        <CommandBlock key={cmd.id} command={cmd} theme={theme} />
      ))}

      <div className="relative mt-2">
        <CommandInput
          onSubmit={addCommand}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          commandHistory={commandHistory}
          theme={theme}
        />
        {showSuggestions && <CommandSuggestions onSelect={addCommand} theme={theme} />}
      </div>
    </div>
  )
}

// ─── PaneHeader ───────────────────────────────────────────────────────────────

interface PaneHeaderProps {
  label: string
  index: number
}

function PaneHeader({ label, index }: PaneHeaderProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 border-b px-3 py-1"
      style={{
        background: "rgba(4,14,45,0.85)",
        borderBottom: "1px solid rgba(56,160,255,0.18)",
      }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold font-mono"
        style={{
          background: "rgba(56,160,255,0.18)",
          color: "rgba(100,200,255,0.9)",
          boxShadow: "0 0 6px rgba(56,160,255,0.25)",
        }}
      >
        {index}
      </span>
      <span className="font-mono text-[11px] tracking-widest text-blue-400/70 uppercase">
        {label}
      </span>
    </div>
  )
}

// ─── StatusBar ────────────────────────────────────────────────────────────────

interface StatusBarProps {
  theme: ThemeType
  searchTerm: string
  onClearSearch: () => void
}

function StatusBar({ searchTerm, onClearSearch }: StatusBarProps) {
  const [time, setTime] = useState("")

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      )
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="flex shrink-0 items-center justify-between border-t px-4 py-1 text-[10px] font-mono text-blue-400/60"
      style={{
        background: "rgba(4,14,45,0.9)",
        borderTop: "1px solid rgba(56,160,255,0.18)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-green-400"
            style={{ boxShadow: "0 0 4px rgba(74,222,128,0.8)" }}
          />
          main
        </span>
        <span>utf-8</span>
        {searchTerm && (
          <span className="flex items-center gap-1 text-blue-300">
            <span>Search: {searchTerm}</span>
            <button onClick={onClearSearch} className="rounded-sm p-0.5 hover:text-blue-200">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span>ZES v1.0.0</span>
        <span>{time}</span>
      </div>
    </div>
  )
}
