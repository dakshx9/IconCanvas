"use client"

import { motion } from "framer-motion"
import { Pencil, Eraser, MousePointer2, PaintBucket, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Tool, BrushSettings } from "@/types/icon"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MobileToolbarProps {
  currentTool: Tool
  onToolChange: (tool: Tool) => void
  brushSettings: BrushSettings
  onBrushSettingsChange: (settings: BrushSettings) => void
  mobileView: "canvas" | "search"
  onMobileViewChange: (view: "canvas" | "search") => void
}

const tools: { id: Tool; icon: typeof Pencil; label: string }[] = [
  { id: "pen", icon: Pencil, label: "Pen" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "fill", icon: PaintBucket, label: "Fill" },
]

const presetColors = ["#1a1a2e", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#22c55e", "#0ea5e9", "#ffffff"]

export function MobileToolbar({
  currentTool,
  onToolChange,
  brushSettings,
  onBrushSettingsChange,
  mobileView,
}: MobileToolbarProps) {
  if (mobileView !== "canvas") return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-auto min-h-[3.5rem] py-2 border-t border-border bg-card/90 backdrop-blur-xl flex items-center justify-between px-2 gap-1 z-50 pb-[env(safe-area-inset-bottom)]"
    >
      {/* Tools */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            size="icon"
            variant={currentTool === tool.id ? "default" : "ghost"}
            onClick={() => onToolChange(tool.id)}
            className={cn("w-9 h-9", currentTool === tool.id && "shadow-md shadow-primary/20")}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      <div className="hidden" />

      {/* Brush Size */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onBrushSettingsChange({ ...brushSettings, size: Math.max(1, brushSettings.size - 2) })}
          className="w-8 h-8"
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs font-mono w-8 text-center text-muted-foreground">{brushSettings.size}</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onBrushSettingsChange({ ...brushSettings, size: Math.min(32, brushSettings.size + 2) })}
          className="w-8 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}
