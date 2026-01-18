"use client"

import type React from "react"

import { useRef, useCallback, useState } from "react"
import { motion } from "framer-motion"
import { Trash2, RotateCw, Move } from "lucide-react"
import type { CanvasIcon, IconData } from "@/types/icon"

interface PaintingCanvasProps {
  icons: CanvasIcon[]
  selectedIconId: string | null
  onSelectIcon: (id: string | null) => void
  onUpdateIcon: (id: string, updates: Partial<CanvasIcon>) => void
  onDeleteIcon: (id: string) => void
  onAddIcon: (icon: IconData) => void
}

export function PaintingCanvas({
  icons,
  selectedIconId,
  onSelectIcon,
  onUpdateIcon,
  onDeleteIcon,
}: PaintingCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        onSelectIcon(null)
      }
    },
    [onSelectIcon],
  )

  const handleDragEnd = useCallback(
    (id: string, info: { point: { x: number; y: number } }) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = info.point.x - rect.left
      const y = info.point.y - rect.top

      onUpdateIcon(id, { x, y })
      setIsDragging(false)
    },
    [onUpdateIcon],
  )

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="relative w-full h-full bg-canvas-bg canvas-grid overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Empty state */}
      {icons.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
            className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4"
          >
            <Move className="w-8 h-8 opacity-30" />
          </motion.div>
          <p className="text-lg font-medium">Your canvas is empty</p>
          <p className="text-sm mt-1">Search and click icons to add them here</p>
        </motion.div>
      )}

      {/* Canvas Icons */}
      {icons.map((canvasIcon) => (
        <DraggableIcon
          key={canvasIcon.id}
          canvasIcon={canvasIcon}
          isSelected={selectedIconId === canvasIcon.id}
          isDragging={isDragging}
          onSelect={() => onSelectIcon(canvasIcon.id)}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(info) => handleDragEnd(canvasIcon.id, info)}
          onDelete={() => onDeleteIcon(canvasIcon.id)}
        />
      ))}
    </div>
  )
}

interface DraggableIconProps {
  canvasIcon: CanvasIcon
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onDragStart: () => void
  onDragEnd: (info: { point: { x: number; y: number } }) => void
  onDelete: () => void
}

function DraggableIcon({ canvasIcon, isSelected, onSelect, onDragStart, onDragEnd, onDelete }: DraggableIconProps) {
  const { icon, x, y, size, color, rotation } = canvasIcon

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width || 24} ${icon.height || 24}" fill="${color}">${icon.body}</svg>`

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={(_, info) => onDragEnd(info)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: x - size / 2,
        y: y - size / 2,
        rotate: rotation,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: size,
        height: size,
        position: "absolute",
        left: 0,
        top: 0,
      }}
      className={`cursor-move flex items-center justify-center rounded-lg transition-shadow ${
        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg" : "hover:shadow-md"
      }`}
    >
      <div style={{ width: size * 0.8, height: size * 0.8 }} dangerouslySetInnerHTML={{ __html: svgContent }} />

      {/* Selection controls */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full glass-effect"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 rounded-full hover:bg-secondary"
            title="Rotate"
          >
            <RotateCw className="w-3.5 h-3.5 text-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 rounded-full hover:bg-destructive hover:text-destructive-foreground"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
