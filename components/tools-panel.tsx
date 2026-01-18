"use client"

import { motion } from "framer-motion"
import { Pencil, Eraser, MousePointer2, PaintBucket, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Tool, BrushSettings } from "@/types/icon"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ToolsPanelProps {
  currentTool: Tool
  onToolChange: (tool: Tool) => void
  brushSettings: BrushSettings
  onBrushSettingsChange: (settings: BrushSettings) => void
}

const tools: { id: Tool; icon: typeof Pencil; label: string; shortcut: string }[] = [
  { id: "pen", icon: Pencil, label: "Pen", shortcut: "P" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "fill", icon: PaintBucket, label: "Fill", shortcut: "G" },
]

const presetColors = ["#1a1a2e", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#0ea5e9"]

export function ToolsPanel({ currentTool, onToolChange, brushSettings, onBrushSettingsChange }: ToolsPanelProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-16 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col items-center py-4 gap-1"
      >
        {/* Tools */}
        <div className="flex flex-col gap-1 p-1 rounded-xl bg-secondary/50">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={currentTool === tool.id ? "default" : "ghost"}
                  onClick={() => onToolChange(tool.id)}
                  className={cn(
                    "w-10 h-10 transition-all duration-200",
                    currentTool === tool.id && "shadow-md shadow-primary/20",
                  )}
                >
                  <tool.icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="tooltip-content flex items-center gap-2">
                {tool.label}
                <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-mono">
                  {tool.shortcut}
                </kbd>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="h-px w-8 bg-border my-2" />

        {/* Brush Size */}
        <div className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onBrushSettingsChange({ ...brushSettings, size: Math.min(32, brushSettings.size + 2) })}
                className="w-8 h-8"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="tooltip-content">
              Increase size
            </TooltipContent>
          </Tooltip>

          <div className="text-[10px] font-mono text-muted-foreground w-8 text-center">{brushSettings.size}px</div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onBrushSettingsChange({ ...brushSettings, size: Math.max(1, brushSettings.size - 2) })}
                className="w-8 h-8"
              >
                <Minus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="tooltip-content">
              Decrease size
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-auto" />
      </motion.aside>
    </TooltipProvider>
  )
}
