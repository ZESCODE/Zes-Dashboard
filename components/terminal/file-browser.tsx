"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, File, FileCode, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"

interface FileBrowserProps {
  theme: ThemeType
  onClose: () => void
}

interface FileItem {
  name: string
  type: "file" | "folder"
  children?: FileItem[]
  expanded?: boolean
  fileType?: "js" | "ts" | "json" | "md" | "other"
}

export default function FileBrowser({ theme, onClose }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([
    {
      name: "project",
      type: "folder",
      expanded: true,
      children: [
        {
          name: "src",
          type: "folder",
          expanded: true,
          children: [
            {
              name: "components",
              type: "folder",
              children: [
                { name: "Button.tsx", type: "file", fileType: "ts" },
                { name: "Card.tsx", type: "file", fileType: "ts" },
                { name: "Input.tsx", type: "file", fileType: "ts" },
              ],
            },
            {
              name: "pages",
              type: "folder",
              children: [
                { name: "index.tsx", type: "file", fileType: "ts" },
                { name: "about.tsx", type: "file", fileType: "ts" },
              ],
            },
            { name: "utils", type: "folder", children: [{ name: "helpers.ts", type: "file", fileType: "ts" }] },
            { name: "app.tsx", type: "file", fileType: "ts" },
            { name: "index.ts", type: "file", fileType: "ts" },
          ],
        },
        { name: "package.json", type: "file", fileType: "json" },
        { name: "tsconfig.json", type: "file", fileType: "json" },
        { name: "README.md", type: "file", fileType: "md" },
      ],
    },
  ])

  const toggleFolder = (path: number[]) => {
    const newFiles = [...files]
    let current = newFiles
    let target = null

    for (const index of path) {
      if (!current[index]) continue
      if (index === path[path.length - 1]) {
        target = current[index]
      } else {
        current = current[index].children || []
      }
    }

    if (target && target.type === "folder") {
      target.expanded = !target.expanded
      setFiles(newFiles)
    }
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder") {
      return file.expanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />
    } else {
      switch (file.fileType) {
        case "js":
          return <FileCode className="h-4 w-4 mr-1 text-yellow-400" />
        case "ts":
          return <FileCode className="h-4 w-4 mr-1 text-blue-400" />
        case "json":
          return <File className="h-4 w-4 mr-1 text-orange-400" />
        case "md":
          return <FileText className="h-4 w-4 mr-1 text-green-400" />
        default:
          return <File className="h-4 w-4 mr-1" />
      }
    }
  }

  const renderFiles = (fileItems: FileItem[], path: number[] = []) => {
    return fileItems.map((file, index) => {
      const currentPath = [...path, index]
      return (
        <div key={`${file.name}-${index}`} className="ml-4">
          <div
            className={cn(
              "flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-800/50",
              file.type === "folder" ? "font-medium" : "",
            )}
            onClick={() => toggleFolder(currentPath)}
          >
            {getFileIcon(file)}
            <span>{file.name}</span>
          </div>
          {file.type === "folder" && file.expanded && file.children && (
            <div>{renderFiles(file.children, currentPath)}</div>
          )}
        </div>
      )
    })
  }

  const getBgColor = () => {
    switch (theme) {
      case "purple":
        return "bg-[#15101e] border-purple-800"
      case "ocean":
        return "bg-[#0a1525] border-blue-800"
      case "midnight":
        return "bg-[#0d0e15] border-gray-700"
      case "darker":
        return "bg-black border-gray-800"
      default:
        return "bg-gray-900 border-gray-800"
    }
  }

  return (
    <div className={cn("w-56 border-r overflow-y-auto", getBgColor())}>
      <div
        className={cn(
          "flex items-center justify-between p-2 border-b sticky top-0",
          theme === "purple"
            ? "border-purple-800"
            : theme === "ocean"
              ? "border-blue-800"
              : theme === "midnight"
                ? "border-gray-700"
                : "border-gray-800",
        )}
      >
        <h3 className="font-medium">Files</h3>
        <button onClick={onClose} className="p-1 rounded-sm hover:bg-gray-800">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="py-2">{renderFiles(files)}</div>
    </div>
  )
}
