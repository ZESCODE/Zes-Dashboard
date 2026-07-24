"use client"

import { FolderOpen, Split, Moon, Keyboard, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"

interface BottomNavProps {
  theme: ThemeType
  onThemeToggle: () => void
  onFileBrowserToggle: () => void
  onSplitViewToggle: () => void
  onKeyboardShortcutsToggle: () => void
  showFileBrowser: boolean
  splitView: boolean
}

export default function BottomNav({
  onThemeToggle,
  onFileBrowserToggle,
  onSplitViewToggle,
  onKeyboardShortcutsToggle,
  showFileBrowser,
  splitView,
}: BottomNavProps) {
  const items = [
    { icon: FolderOpen, label: "Files", action: onFileBrowserToggle, active: showFileBrowser },
    { icon: Split, label: "Split", action: onSplitViewToggle, active: splitView },
    { icon: Moon, label: "Theme", action: onThemeToggle },
    { icon: Keyboard, label: "Keys", action: onKeyboardShortcutsToggle },
    { icon: Settings, label: "Config", action: undefined },
  ]

  return (
    <nav
      className="flex items-center justify-around border-t px-1 py-2"
      style={{
        background: "rgba(4, 14, 45, 0.88)",
        borderTop: "1px solid rgba(56,160,255,0.25)",
        boxShadow: "0 -4px 24px rgba(56,160,255,0.08)",
      }}
    >
      {items.map(({ icon: Icon, label, action, active }) => (
        <button
          key={label}
          onClick={action}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] font-mono transition-all duration-150",
            active
              ? "text-blue-300"
              : "text-blue-500/50 hover:text-blue-300",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 transition-all",
              active && "drop-shadow-[0_0_6px_rgba(56,160,255,0.8)]",
            )}
          />
          <span
            className={cn(
              "tracking-wider",
              active && "text-blue-300",
            )}
          >
            {label}
          </span>
          {active && (
            <span className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(56,160,255,0.9)]" />
          )}
        </button>
      ))}
    </nav>
  )
}
