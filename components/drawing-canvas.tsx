"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Undo2, Redo2, RotateCcw, Wand2, Pencil, Eraser, MousePointer2, PaintBucket, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CanvasIcon, IconData, Tool, BrushSettings } from "@/types/icon"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DrawingCanvasProps {
  icons: CanvasIcon[]
  selectedIconId: string | null
  onSelectIcon: (id: string | null) => void
  onUpdateIcon: (id: string, updates: Partial<CanvasIcon>) => void
  onDeleteIcon: (id: string) => void
  onAddIcon: (icon: IconData, position?: { x: number; y: number }) => void
  onAISearch: (query: string) => void
  currentTool: Tool
  onToolChange: (tool: Tool) => void
  brushSettings: BrushSettings
  onBrushSettingsChange: (settings: BrushSettings) => void
  isAnalyzing: boolean
  setIsAnalyzing: (value: boolean) => void
}

export interface DrawingCanvasRef {
  clear: () => void
}

const tools: { id: Tool; icon: typeof Pencil; label: string }[] = [
  { id: "pen", icon: Pencil, label: "Pen" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "fill", icon: PaintBucket, label: "Fill" },
]

const presetColors = ["#1a1a2e", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#22c55e", "#0ea5e9", "#ffffff"]

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  icons,
  selectedIconId,
  onSelectIcon,
  onUpdateIcon,
  onAISearch,
  currentTool,
  onToolChange,
  brushSettings,
  onBrushSettingsChange,
  isAnalyzing,
  setIsAnalyzing,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 })

  // Initialize canvas
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      const padding = 32
      const maxWidth = Math.min(rect.width - padding, 1200)
      const maxHeight = Math.min(rect.height - padding, 800)
      const width = Math.max(maxWidth, 280)
      const height = Math.max(maxHeight, 200)
      setCanvasSize({ width, height })

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
        const initialState = ctx.getImageData(0, 0, width, height)
        setDrawingHistory([initialState])
        setHistoryStep(0)
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  // Expose clear method to parent via ref
  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (canvas && ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        setDrawingHistory([imageData])
        setHistoryStep(0)
      }
    }
  }), [])


  const saveState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = drawingHistory.slice(0, historyStep + 1)
    newHistory.push(imageData)
    if (newHistory.length > 30) newHistory.shift()
    setDrawingHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }, [drawingHistory, historyStep])

  const undo = useCallback(() => {
    if (historyStep > 0) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return
      const newStep = historyStep - 1
      setHistoryStep(newStep)
      ctx.putImageData(drawingHistory[newStep], 0, 0)
    }
  }, [drawingHistory, historyStep])

  const redo = useCallback(() => {
    if (historyStep < drawingHistory.length - 1) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return
      const newStep = historyStep + 1
      setHistoryStep(newStep)
      ctx.putImageData(drawingHistory[newStep], 0, 0)
    }
  }, [drawingHistory, historyStep])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveState()
    toast.success("Canvas cleared")
  }, [saveState])

  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()

      if ("touches" in e) {
        const touch = e.touches[0]
        return {
          x: (touch.clientX - rect.left) * (canvas.width / rect.width),
          y: (touch.clientY - rect.top) * (canvas.height / rect.height),
        }
      }
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      }
    },
    [],
  )

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (currentTool === "select") return
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx || !canvas) return

      const { x, y } = getCanvasCoordinates(e)

      if (currentTool === "fill") {
        ctx.fillStyle = brushSettings.color
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        saveState()
        return
      }

      setIsDrawing(true)
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [currentTool, getCanvasCoordinates, brushSettings.color, saveState],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || currentTool === "select") return
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return

      const { x, y } = getCanvasCoordinates(e)
      ctx.lineWidth = brushSettings.size
      ctx.globalAlpha = brushSettings.opacity

      if (currentTool === "pen") {
        ctx.strokeStyle = brushSettings.color
        ctx.globalCompositeOperation = "source-over"
      } else if (currentTool === "eraser") {
        ctx.strokeStyle = "#ffffff"
        ctx.globalCompositeOperation = "source-over"
      }

      ctx.lineTo(x, y)
      ctx.stroke()
    },
    [isDrawing, currentTool, getCanvasCoordinates, brushSettings],
  )

  const stopDrawing = useCallback(() => {
    if (isDrawing) saveState()
    setIsDrawing(false)
  }, [isDrawing, saveState])

  const analyzeDrawing = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsAnalyzing(true)

    try {
      const imageData = canvas.toDataURL("image/png")
      const base64Image = imageData.split(",")[1]

      const response = await fetch("/api/analyze-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      })

      const data = await response.json()

      if (data.keywords && data.keywords.length > 0) {
        toast.success(`AI found: ${data.keywords.join(", ")}`)
        onAISearch(data.keywords.join(" "))
      } else {
        toast.error("Could not identify objects. Try drawing more clearly.")
      }
    } catch (error) {
      toast.error("Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [onAISearch, setIsAnalyzing])

  const handleIconDrag = useCallback(
    (iconId: string, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const icon = icons.find((i) => i.id === iconId)
      if (!icon) return

      const startX = "touches" in e ? e.touches[0].clientX : e.clientX
      const startY = "touches" in e ? e.touches[0].clientY : e.clientY
      const startIconX = icon.x
      const startIconY = icon.y

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
        const clientY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY
        onUpdateIcon(iconId, {
          x: startIconX + (clientX - startX),
          y: startIconY + (clientY - startY),
        })
      }

      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove)
        document.removeEventListener("mouseup", handleUp)
        document.removeEventListener("touchmove", handleMove)
        document.removeEventListener("touchend", handleUp)
      }

      document.addEventListener("mousemove", handleMove)
      document.addEventListener("mouseup", handleUp)
      document.addEventListener("touchmove", handleMove)
      document.addEventListener("touchend", handleUp)
    },
    [icons, onUpdateIcon],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  const getCursor = () => {
    switch (currentTool) {
      case "pen":
      case "eraser":
      case "fill":
        return "crosshair"
      default:
        return "default"
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div ref={containerRef} className="flex-1 relative bg-muted/30 flex overflow-hidden">
        {/* Desktop Tools Panel */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:flex w-14 border-r border-border bg-card/50 backdrop-blur-sm flex-col items-center py-3 gap-1"
        >
          <div className="flex flex-col gap-1 p-1 rounded-xl bg-secondary/50">
            {tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={currentTool === tool.id ? "default" : "ghost"}
                    onClick={() => onToolChange(tool.id)}
                    className={cn("w-9 h-9", currentTool === tool.id && "shadow-md shadow-primary/20")}
                  >
                    <tool.icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{tool.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="h-px w-8 bg-border my-2" />

          {/* Brush Size */}
          <div className="flex flex-col items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onBrushSettingsChange({ ...brushSettings, size: Math.min(32, brushSettings.size + 2) })}
              className="w-7 h-7"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <span className="text-[9px] font-mono text-muted-foreground">{brushSettings.size}px</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onBrushSettingsChange({ ...brushSettings, size: Math.max(1, brushSettings.size - 2) })}
              className="w-7 h-7"
            >
              <Minus className="w-3 h-3" />
            </Button>
          </div>

          <div className="mt-auto" />
        </motion.aside>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-hidden">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative drawing-canvas-container"
            style={{ width: canvasSize.width, height: canvasSize.height, maxWidth: "100%", maxHeight: "100%" }}
          >
            <div className="absolute inset-0 canvas-grid-pattern opacity-50 pointer-events-none rounded-xl" />

            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="relative z-10 rounded-xl touch-none"
              style={{ cursor: getCursor(), width: "100%", height: "100%" }}
            />

            {/* Icons Layer */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {icons.map((icon) => (
                <div
                  key={icon.id}
                  style={{
                    position: "absolute",
                    left: icon.x,
                    top: icon.y,
                    transform: `rotate(${icon.rotation}deg)`,
                    opacity: icon.opacity,
                    cursor: "move",
                    pointerEvents: "auto",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseDown={(e) => {
                    onSelectIcon(icon.id)
                    handleIconDrag(icon.id, e)
                  }}
                  onTouchStart={(e) => {
                    onSelectIcon(icon.id)
                    handleIconDrag(icon.id, e)
                  }}
                  className={cn(
                    "hover:drop-shadow-lg",
                    selectedIconId === icon.id && "ring-2 ring-primary ring-offset-2 ring-offset-white rounded-lg",
                  )}
                >
                  {icon.icon.url ? (
                    <img
                      src={icon.icon.url}
                      alt={icon.icon.name}
                      style={{ width: icon.size, height: icon.size }}
                      className="pointer-events-none select-none object-contain"
                      draggable={false}
                    />
                  ) : (
                    <img
                      src={`https://api.iconify.design/${icon.icon.prefix}/${icon.icon.name}.svg?color=${encodeURIComponent(icon.color)}`}
                      alt={icon.icon.name}
                      style={{ width: icon.size, height: icon.size }}
                      className="pointer-events-none select-none"
                      draggable={false}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {icons.length === 0 && !isDrawing && historyStep === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <div className="text-center space-y-3 max-w-xs px-4">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    className="w-12 h-12 md:w-14 md:h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                  >
                    <Pencil className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-foreground/80 mb-1">Start Drawing</h3>
                    <p className="text-xs md:text-sm text-muted-foreground text-balance">
                      Sketch any object, then use AI to find matching icons
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Floating Action Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 glass-panel rounded-xl md:rounded-2xl shadow-xl">
            <Button
              size="icon"
              variant="ghost"
              onClick={undo}
              disabled={historyStep <= 0}
              className="w-8 h-8 md:w-10 md:h-10"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={redo}
              disabled={historyStep >= drawingHistory.length - 1}
              className="w-8 h-8 md:w-10 md:h-10"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={clearCanvas}
              className="w-8 h-8 md:w-10 md:h-10 hover:text-destructive"
              title="Clear"
            >
              <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>

            <div className="h-6 md:h-8 w-px bg-border mx-0.5 md:mx-1" />

            <Button
              onClick={analyzeDrawing}
              disabled={isAnalyzing}
              className={cn(
                "btn-premium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
                "text-primary-foreground px-3 md:px-5 py-2 md:py-5 text-xs md:text-sm font-medium rounded-lg md:rounded-xl",
                "shadow-lg shadow-primary/20 gap-1.5 md:gap-2",
              )}
            >
              {isAnalyzing ? (
                <>
                  <div className="loader-dots flex gap-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                  </div>
                  <span className="hidden sm:inline">Analyzing</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">AI Search</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
})

DrawingCanvas.displayName = "DrawingCanvas"
