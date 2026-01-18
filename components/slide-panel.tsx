"use client"

import { Plus, Copy, Trash2, ChevronLeft, ChevronRight, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CanvasSlide } from "@/types/slide"
import { createBlankSlide } from "@/types/slide"

interface SlidePanelProps {
    slides: CanvasSlide[]
    currentSlideIndex: number
    onSelectSlide: (index: number) => void
    onAddSlide: () => void
    onDuplicateSlide: (index: number) => void
    onDeleteSlide: (index: number) => void
    onRenameSlide: (index: number, name: string) => void
    rightPanelWidth?: number
}

export function SlidePanel({
    slides,
    currentSlideIndex,
    onSelectSlide,
    onAddSlide,
    onDuplicateSlide,
    onDeleteSlide,
    onRenameSlide,
    rightPanelWidth = 320
}: SlidePanelProps) {
    const canGoBack = currentSlideIndex > 0
    const canGoForward = currentSlideIndex < slides.length - 1

    return (
        <div className="fixed bottom-0 left-16 z-[50] bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 px-3 py-2 h-[72px]" style={{ right: rightPanelWidth }}>
            {/* Navigation Arrows */}
            <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 shrink-0"
                onClick={() => onSelectSlide(currentSlideIndex - 1)}
                disabled={!canGoBack}
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Slide Thumbnails */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-neutral-800">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        onClick={() => onSelectSlide(index)}
                        className={cn(
                            "shrink-0 w-20 h-14 rounded-lg border-2 cursor-pointer transition-all relative group overflow-hidden",
                            index === currentSlideIndex
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-neutral-700 hover:border-neutral-600"
                        )}
                        style={{ backgroundColor: slide.bgColor }}
                    >
                        {/* Slide Number */}
                        <div className="absolute top-0.5 left-1 text-[8px] font-mono text-neutral-400 bg-black/50 px-1 rounded">
                            {index + 1}
                        </div>

                        {/* Slide Name */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                            <input
                                type="text"
                                value={slide.name}
                                onChange={(e) => onRenameSlide(index, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-transparent text-[8px] text-white outline-none truncate"
                            />
                        </div>

                        {/* Actions (show on hover) */}
                        <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDuplicateSlide(index) }}
                                className="w-4 h-4 rounded bg-black/60 flex items-center justify-center hover:bg-black/80"
                                title="Duplicate"
                            >
                                <Copy className="w-2.5 h-2.5 text-white" />
                            </button>
                            {slides.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteSlide(index) }}
                                    className="w-4 h-4 rounded bg-black/60 flex items-center justify-center hover:bg-red-500/80"
                                    title="Delete"
                                >
                                    <Trash2 className="w-2.5 h-2.5 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Mini Preview Icons */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                            {slide.icons.length > 0 && <FileImage className="w-4 h-4" />}
                        </div>
                    </div>
                ))}

                {/* Add Slide Button */}
                <button
                    onClick={onAddSlide}
                    className="shrink-0 w-20 h-14 rounded-lg border-2 border-dashed border-neutral-700 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all"
                >
                    <Plus className="w-5 h-5 text-neutral-500" />
                </button>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 shrink-0"
                onClick={() => onSelectSlide(currentSlideIndex + 1)}
                disabled={!canGoForward}
            >
                <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Slide Counter */}
            <div className="text-xs text-neutral-500 shrink-0 w-16 text-center">
                {currentSlideIndex + 1} / {slides.length}
            </div>
        </div>
    )
}
