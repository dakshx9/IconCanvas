"use client"

import { motion } from "framer-motion"
import { Sparkles, Layers, Pencil, Eraser, MousePointer2, PaintBucket, Loader2 } from "lucide-react"
import type { Tool } from "@/types/icon"

interface StatusBarProps {
  iconCount: number
  isAnalyzing: boolean
  currentTool: Tool
}

const toolIcons: Record<Tool, typeof Pencil> = {
  pen: Pencil,
  eraser: Eraser,
  select: MousePointer2,
  fill: PaintBucket,
}

const toolNames: Record<Tool, string> = {
  pen: "Pen Tool",
  eraser: "Eraser",
  select: "Select",
  fill: "Fill",
}

export function StatusBar({ iconCount, isAnalyzing, currentTool }: StatusBarProps) {
  const ToolIcon = toolIcons[currentTool]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-8 border-t border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 text-xs text-muted-foreground"
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <ToolIcon className="w-3 h-3" />
          <span>{toolNames[currentTool]}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          <span>{iconCount} icons</span>
        </div>
      </div>

      {/* Center - AI Status */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary"
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="font-medium">AI analyzing drawing...</span>
        </motion.div>
      )}

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-primary" />
        <span>Powered by Gemini AI</span>
      </div>
    </motion.div>
  )
}
