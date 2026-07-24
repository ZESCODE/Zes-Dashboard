"use client"

import { X, Plus } from "lucide-react"

interface TabsProps {
  activeTab: number
  setActiveTab: (index: number) => void
  theme?: string
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  const tabs = [
    { name: "Terminal", path: "~/projects" },
    { name: "SSH", path: "user@remote-server" },
  ]

  return (
    <div
      className="flex border-b"
      style={{
        background: "rgba(4,14,45,0.85)",
        borderBottom: "1px solid rgba(56,160,255,0.18)",
      }}
    >
      {tabs.map((tab, index) => (
        <div
          key={index}
          className="group relative flex cursor-pointer items-center gap-2 border-r px-4 py-2 text-sm font-mono transition-all"
          style={{
            borderRight: "1px solid rgba(56,160,255,0.15)",
            background:
              activeTab === index
                ? "rgba(20,60,140,0.55)"
                : "transparent",
            color: activeTab === index ? "rgba(180,220,255,1)" : "rgba(100,160,220,0.55)",
            boxShadow:
              activeTab === index
                ? "inset 0 -2px 0 rgba(56,160,255,0.7)"
                : "none",
          }}
          onClick={() => setActiveTab(index)}
        >
          <span>{tab.name}</span>
          <span className="text-[10px] text-blue-500/40">{tab.path}</span>
          <button className="ml-2 hidden rounded-sm p-0.5 text-blue-500/40 hover:text-blue-200 group-hover:block">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        className="px-3 text-blue-500/40 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
