"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Trash2, Moon, Sun, Download, Github, Monitor, Layers, PanelRight, Paintbrush, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { useEffect, useState, useCallback } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useCollaborationSafe } from "@/lib/collaboration-context"
import { GroupModal } from "@/components/group-modal"
import { cn } from "@/lib/utils"

interface HeaderProps {
  onClear: () => void
  iconCount: number
  mobileView?: "canvas" | "search"
  onMobileViewChange?: (view: "canvas" | "search") => void
  isMobile?: boolean
  onOpenEditor?: () => void
}

export function Header({ onClear, iconCount, mobileView, onMobileViewChange, isMobile, onOpenEditor }: HeaderProps) {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const collab = useCollaborationSafe()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleExport = useCallback(async () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement
    if (!canvas) {
      toast.error("No canvas found to export")
      return
    }

    try {
      // Create a temporary canvas for composition
      const tempCanvas = document.createElement("canvas")
      const ctx = tempCanvas.getContext("2d")
      if (!ctx) return

      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height

      // 1. Draw the user's drawing first
      ctx.drawImage(canvas, 0, 0)

      // 2. Fetch and draw all icons
      // We need to look up the icon data from the parent component somehow, or grab them from DOM
      // Since we don't have direct access to 'icons' state here, we'll try to reconstruct from DOM or ask user to move logic
      // Actually, relying on DOM is safer here given the architecture
      // But DOM images might be cross-origin protected. 
      // Let's rely on finding the container and iterating the children which are rendered absolutely.

      // Better approach: Since 'icons' state is in Page or Layout, we can't easily access it here without prop drilling.
      // However, the images are rendered in the DOM as siblings to the canvas usually (in drawing-canvas).
      // Let's modify the architecture slightly: handleExport should be passed down to DrawingCanvas or we use a custom event.
      // But for now, let's try to find the images in the container.

      const container = canvas.parentElement
      if (!container) return

      // Find all icon divs
      const iconDivs = Array.from(container.querySelectorAll("div > div")) // Broad selector, assuming structure
      // Wait, specific structure in drawing-canvas is: 
      // <div className="absolute inset-0 z-20 pointer-events-none"> {icons.map...} </div>
      // So we look for that container.

      const iconLayer = container.querySelector(".absolute.z-20") as HTMLElement
      if (iconLayer) {
        const icons = Array.from(iconLayer.children) as HTMLElement[]

        await Promise.all(icons.map(async (iconEl) => {
          const img = iconEl.querySelector("img")
          if (!img) return

          const rect = iconEl.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          // Calculate relative position to canvas
          // Note: The iconEl.style.left/top should be reliable if set in pixels
          const x = parseFloat(iconEl.style.left || "0")
          const y = parseFloat(iconEl.style.top || "0")

          // Parse rotation
          const transform = iconEl.style.transform || ""
          const rotationMatch = transform.match(/rotate\(([-\d.]+)deg\)/)
          const rotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0

          const width = parseFloat(iconEl.style.width || "0") || img.width
          const height = parseFloat(iconEl.style.height || "0") || img.height

          // Save context for rotation
          ctx.save()

          // Move to center of icon for rotation
          ctx.translate(x + width / 2, y + height / 2)
          ctx.rotate((rotation * Math.PI) / 180)

          // Draw image centered
          // We need to load a simplified version of the image to avoid taint if possible, 
          // or just try drawing the existing DOM image if it's loaded.
          // For cross-origin images (Freepik), we might face issues if cors isn't set.
          // The proxy sets Access-Control-Allow-Origin: *, so crossOrigin="anonymous" on img tag helps.

          // Create a new image to ensure clean state
          await new Promise<void>((resolve, reject) => {
            const drawImg = new Image()
            drawImg.crossOrigin = "anonymous"
            drawImg.onload = () => {
              ctx.drawImage(drawImg, -width / 2, -height / 2, width, height)
              resolve()
            }
            drawImg.onerror = () => {
              // If it fails (e.g. CORS), we skip it but resolve to continue
              console.warn("Could not export icon", img.src)
              resolve()
            }
            drawImg.src = img.src
          })

          ctx.restore()
        }))
      }

      const link = document.createElement("a")
      link.download = `iconcanvas-${Date.now()}.png`
      link.href = tempCanvas.toDataURL("image/png")
      link.click()
      toast.success("Canvas exported successfully")

    } catch (error) {
      console.error("Export failed", error)
      toast.error("Failed to export canvas")
    }
  }, [])

  const handleClear = useCallback(() => {
    onClear()
    toast.success("Canvas cleared")
  }, [onClear])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-14 md:h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-3 md:px-6 z-40 relative"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        <motion.div
          className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground relative z-10" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
          />
        </motion.div>
        <div className="hidden sm:block">
          <h1 className="text-base md:text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            IconCanvas AI
          </h1>
          <p className="text-[9px] md:text-[10px] text-muted-foreground tracking-wide uppercase">
            Draw. Discover. Design.
          </p>
        </div>
      </div>

      {/* Mobile View Toggle */}
      {isMobile && onMobileViewChange && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
          <Button
            variant={mobileView === "canvas" ? "default" : "ghost"}
            size="sm"
            onClick={() => onMobileViewChange("canvas")}
            className="h-8 px-3 gap-1.5"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="text-xs">Canvas</span>
          </Button>
          <Button
            variant={mobileView === "search" ? "default" : "ghost"}
            size="sm"
            onClick={() => onMobileViewChange("search")}
            className="h-8 px-3 gap-1.5"
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span className="text-xs">Icons</span>
          </Button>
        </div>
      )}

      {/* Desktop Icon Counter */}
      {!isMobile && (
        <AnimatePresence mode="wait">
          <motion.div
            key={iconCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 border border-border"
          >
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {iconCount} {iconCount === 1 ? "icon" : "icons"}
            </span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">

        {/* Open Editor Button (Desktop) */}
        {!isMobile && onOpenEditor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenEditor}
            className="hidden md:flex gap-2 mr-2 bg-secondary/50 hover:bg-secondary/80 border border-border/50"
          >
            <Paintbrush className="w-4 h-4" />
            <span className="text-xs font-medium">Open Editor</span>
          </Button>
        )}


        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 md:w-9 md:h-9 relative overflow-hidden">
                <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel">
              <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
                <Sun className="w-4 h-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
                <Moon className="w-4 h-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
                <Monitor className="w-4 h-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleExport}
          className="w-8 h-8 md:w-9 md:h-9 hidden sm:flex"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="w-8 h-8 md:w-9 md:h-9 hover:text-destructive hover:bg-destructive/10"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="h-5 w-px bg-border mx-0.5 hidden md:block" />

        <Button variant="ghost" size="icon" asChild className="w-8 h-8 md:w-9 md:h-9 hidden md:flex">
          <a href="https://github.com/dakshx9/IconCanvas/" target="_blank" rel="noopener noreferrer" title="GitHub">
            <Github className="w-4 h-4" />
          </a>
        </Button>
      </div>

      {/* Group Modal */}
      <GroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} />
    </motion.header>
  )
}
