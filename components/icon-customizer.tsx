"use client"

import { X, Maximize2, RotateCcw, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import type { CanvasIcon } from "@/types/icon"
import { cn } from "@/lib/utils"

interface IconCustomizerProps {
  icon: CanvasIcon
  onUpdate: (updates: Partial<CanvasIcon>) => void
  onDelete: () => void
  onDuplicate: () => void
  onClose: () => void
  onOpenEditor?: () => void
  isMobile?: boolean
}

export function IconCustomizer({ icon, onUpdate, onDelete, onClose, onOpenEditor, isMobile }: IconCustomizerProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border shadow-xl overflow-hidden z-50",
        isMobile
          ? "fixed bottom-28 left-2 right-2 rounded-xl"
          : "absolute bottom-20 left-20 w-56 rounded-xl",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {icon.icon.url ? (
            <img
              src={icon.icon.url}
              alt={icon.icon.name}
              className="w-7 h-7 rounded-lg object-contain bg-background p-0.5"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-background p-0.5 flex items-center justify-center text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${icon.icon.width || 24} ${icon.icon.height || 24}`}
                fill="currentColor"
                className="w-5 h-5"
                dangerouslySetInnerHTML={{ __html: icon.icon.body || '' }}
              />
            </div>
          )}
          <p className="font-medium text-xs text-foreground truncate max-w-[100px]">{icon.icon.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="w-6 h-6">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-3">
        {/* Size */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-foreground text-xs">
              <Maximize2 className="w-3 h-3 text-muted-foreground" /> Size
            </Label>
            <span className="text-[10px] font-mono text-muted-foreground">{icon.size}px</span>
          </div>
          <Slider
            value={[icon.size]}
            onValueChange={([value]) => onUpdate({ size: value })}
            min={24}
            max={200}
            step={4}
            className="cursor-pointer"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-foreground text-xs">
              <RotateCcw className="w-3 h-3 text-muted-foreground" /> Rotation
            </Label>
            <span className="text-[10px] font-mono text-muted-foreground">{icon.rotation}°</span>
          </div>
          <Slider
            value={[icon.rotation]}
            onValueChange={([value]) => onUpdate({ rotation: value })}
            min={0}
            max={360}
            step={15}
            className="cursor-pointer"
          />
        </div>

        {/* Open in Editor Button */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <Button
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
            onClick={onOpenEditor}
          >
            <Edit3 className="w-4 h-4" />
            Open Canvas Editor
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Icon
          </Button>
        </div>
      </div>
    </div>
  )
}
