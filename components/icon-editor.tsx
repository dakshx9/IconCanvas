"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
    X, ZoomIn, ZoomOut, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
    Maximize2, Move, Eye, Trash2, Copy, Download, Check, Undo2, Redo2,
    AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    Layers, ChevronUp, ChevronDown, Lock, Unlock, Square, Circle, Hexagon,
    Sun, Moon, Contrast, Droplets, Wind, Sparkles, Grid3X3, Code, Clipboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { CanvasIcon } from "@/types/icon"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface IconEditorProps {
    icon: CanvasIcon
    allIcons: CanvasIcon[]
    onUpdate: (updates: Partial<CanvasIcon>) => void
    onUpdateAll: (icons: CanvasIcon[]) => void
    onDelete: () => void
    onDuplicate: () => void
    onClose: () => void
}

// Extended icon state for editor-only effects
interface EditorEffects {
    flipX: boolean
    flipY: boolean
    shadow: number
    blur: number
    brightness: number
    contrast: number
    saturate: number
    grayscale: boolean
    backgroundShape: "none" | "circle" | "square" | "rounded"
    backgroundColor: string
}

const BACKGROUND_COLORS = [
    "#ffffff", "#f1f5f9", "#e2e8f0", "#1e293b", "#0f172a",
    "#fef2f2", "#fef9c3", "#dcfce7", "#e0f2fe", "#f3e8ff"
]

const PRESETS = [
    { name: "Default", size: 56, rotation: 0, opacity: 1 },
    { name: "Small", size: 32, rotation: 0, opacity: 1 },
    { name: "Large", size: 96, rotation: 0, opacity: 1 },
    { name: "Tilted", size: 56, rotation: 15, opacity: 1 },
    { name: "Faded", size: 56, rotation: 0, opacity: 0.5 },
    { name: "Big & Bold", size: 128, rotation: 0, opacity: 1 },
]

export function IconEditor({
    icon,
    allIcons,
    onUpdate,
    onUpdateAll,
    onDelete,
    onDuplicate,
    onClose
}: IconEditorProps) {
    const [zoom, setZoom] = useState(100)
    const [locked, setLocked] = useState(false)
    const [showGrid, setShowGrid] = useState(false)
    const [history, setHistory] = useState<Partial<CanvasIcon>[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [activeTab, setActiveTab] = useState<"transform" | "effects" | "position">("transform")

    // Editor-only effects (not persisted to canvas)
    const [effects, setEffects] = useState<EditorEffects>({
        flipX: false,
        flipY: false,
        shadow: 0,
        blur: 0,
        brightness: 100,
        contrast: 100,
        saturate: 100,
        grayscale: false,
        backgroundShape: "none",
        backgroundColor: "#ffffff"
    })

    const previewRef = useRef<HTMLDivElement>(null)

    // Save state for undo/redo
    const saveToHistory = useCallback((state: Partial<CanvasIcon>) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1)
            newHistory.push(state)
            return newHistory.slice(-20)
        })
        setHistoryIndex(prev => Math.min(prev + 1, 19))
    }, [historyIndex])

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1]
            onUpdate(prevState)
            setHistoryIndex(prev => prev - 1)
        }
    }, [history, historyIndex, onUpdate])

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1]
            onUpdate(nextState)
            setHistoryIndex(prev => prev + 1)
        }
    }, [history, historyIndex, onUpdate])

    // Quick actions
    const rotate90CW = () => {
        const newRotation = (icon.rotation + 90) % 360
        onUpdate({ rotation: newRotation })
        saveToHistory({ rotation: newRotation })
    }

    const rotate90CCW = () => {
        const newRotation = (icon.rotation - 90 + 360) % 360
        onUpdate({ rotation: newRotation })
        saveToHistory({ rotation: newRotation })
    }

    const resetTransform = () => {
        onUpdate({ rotation: 0, size: 56, opacity: 1 })
        setEffects({
            flipX: false,
            flipY: false,
            shadow: 0,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100,
            grayscale: false,
            backgroundShape: "none",
            backgroundColor: "#ffffff"
        })
        setZoom(100)
        toast.success("Transform reset")
    }

    const applyPreset = (preset: typeof PRESETS[0]) => {
        onUpdate({ size: preset.size, rotation: preset.rotation, opacity: preset.opacity })
        saveToHistory({ size: preset.size, rotation: preset.rotation, opacity: preset.opacity })
        toast.success(`Applied "${preset.name}" preset`)
    }

    // Layer management
    const bringToFront = () => {
        const index = allIcons.findIndex(i => i.id === icon.id)
        if (index < allIcons.length - 1) {
            const newIcons = [...allIcons]
            newIcons.splice(index, 1)
            newIcons.push(icon)
            onUpdateAll(newIcons)
            toast.success("Brought to front")
        }
    }

    const sendToBack = () => {
        const index = allIcons.findIndex(i => i.id === icon.id)
        if (index > 0) {
            const newIcons = [...allIcons]
            newIcons.splice(index, 1)
            newIcons.unshift(icon)
            onUpdateAll(newIcons)
            toast.success("Sent to back")
        }
    }

    // Alignment helpers
    const alignLeft = () => onUpdate({ x: 20 })
    const alignCenterH = () => onUpdate({ x: 300 - icon.size / 2 })
    const alignRight = () => onUpdate({ x: 580 - icon.size })
    const alignTop = () => onUpdate({ y: 20 })
    const alignCenterV = () => onUpdate({ y: 200 - icon.size / 2 })
    const alignBottom = () => onUpdate({ y: 380 - icon.size })

    // Download icon
    const downloadIcon = async () => {
        try {
            if (icon.icon.url) {
                const response = await fetch(icon.icon.url)
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `${icon.icon.name}.png`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success("Icon downloaded")
            }
        } catch {
            toast.error("Download failed")
        }
    }

    // Copy position as CSS
    const copyCSSPosition = () => {
        const css = `position: absolute;
left: ${icon.x}px;
top: ${icon.y}px;
width: ${icon.size}px;
height: ${icon.size}px;
transform: rotate(${icon.rotation}deg);
opacity: ${icon.opacity};`
        navigator.clipboard.writeText(css)
        toast.success("CSS copied to clipboard")
    }

    const handleDuplicate = () => {
        onDuplicate()
        toast.success("Icon duplicated")
    }

    const handleDelete = () => {
        onDelete()
        onClose()
        toast.success("Icon deleted")
    }

    // Build filter string for effects
    const getFilterStyle = () => {
        const filters = []
        if (effects.blur > 0) filters.push(`blur(${effects.blur}px)`)
        if (effects.brightness !== 100) filters.push(`brightness(${effects.brightness}%)`)
        if (effects.contrast !== 100) filters.push(`contrast(${effects.contrast}%)`)
        if (effects.saturate !== 100) filters.push(`saturate(${effects.saturate}%)`)
        if (effects.grayscale) filters.push(`grayscale(100%)`)
        return filters.length > 0 ? filters.join(" ") : "none"
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
                else if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo() }
                else if (e.key === "d") { e.preventDefault(); handleDuplicate() }
                else if (e.key === "c" && e.shiftKey) { e.preventDefault(); copyCSSPosition() }
            }
            if (e.key === "Delete" || e.key === "Backspace") {
                if (document.activeElement?.tagName !== "INPUT") handleDelete()
            }
            // Arrow keys for nudge
            if (!e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT") {
                const nudge = e.shiftKey ? 10 : 1
                if (e.key === "ArrowUp") { e.preventDefault(); onUpdate({ y: icon.y - nudge }) }
                if (e.key === "ArrowDown") { e.preventDefault(); onUpdate({ y: icon.y + nudge }) }
                if (e.key === "ArrowLeft") { e.preventDefault(); onUpdate({ x: icon.x - nudge }) }
                if (e.key === "ArrowRight") { e.preventDefault(); onUpdate({ x: icon.x + nudge }) }
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [onClose, undo, redo, icon.x, icon.y])

    return (
        <div className="fixed inset-0 z-[100] bg-background flex">
            {/* Left Toolbar */}
            <div className="w-14 border-r border-border bg-card flex flex-col items-center py-3 gap-1">
                <Button variant="ghost" size="icon" className="w-10 h-10" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
                    <Undo2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-10 h-10" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)">
                    <Redo2 className="w-4 h-4" />
                </Button>

                <div className="h-px w-8 bg-border my-2" />

                <Button variant="ghost" size="icon" className="w-10 h-10" onClick={rotate90CCW} title="Rotate 90° CCW">
                    <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-10 h-10" onClick={rotate90CW} title="Rotate 90° CW">
                    <RotateCw className="w-4 h-4" />
                </Button>

                <div className="h-px w-8 bg-border my-2" />

                <Button
                    variant={effects.flipX ? "default" : "ghost"}
                    size="icon"
                    className="w-10 h-10"
                    onClick={() => setEffects(e => ({ ...e, flipX: !e.flipX }))}
                    title="Flip Horizontal"
                >
                    <FlipHorizontal className="w-4 h-4" />
                </Button>
                <Button
                    variant={effects.flipY ? "default" : "ghost"}
                    size="icon"
                    className="w-10 h-10"
                    onClick={() => setEffects(e => ({ ...e, flipY: !e.flipY }))}
                    title="Flip Vertical"
                >
                    <FlipVertical className="w-4 h-4" />
                </Button>

                <div className="h-px w-8 bg-border my-2" />

                <Button
                    variant={locked ? "default" : "ghost"}
                    size="icon"
                    className="w-10 h-10"
                    onClick={() => setLocked(!locked)}
                    title={locked ? "Unlock" : "Lock"}
                >
                    {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>

                <Button
                    variant={showGrid ? "default" : "ghost"}
                    size="icon"
                    className="w-10 h-10"
                    onClick={() => setShowGrid(!showGrid)}
                    title="Toggle Grid"
                >
                    <Grid3X3 className="w-4 h-4" />
                </Button>

                <div className="mt-auto" />

                <Button variant="ghost" size="icon" className="w-10 h-10" onClick={resetTransform} title="Reset All">
                    <Move className="w-4 h-4" />
                </Button>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="h-12 border-b border-border bg-card/50 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-sm">Icon Editor</h2>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">{icon.icon.name}</span>
                        <span className="text-[10px] text-muted-foreground">Layer {allIcons.findIndex(i => i.id === icon.id) + 1} of {allIcons.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.max(25, z - 25))}>
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.min(400, z + 25))}>
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setZoom(100)}>
                            Fit
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={copyCSSPosition} title="Copy CSS (Ctrl+Shift+C)">
                            <Code className="w-3.5 h-3.5" />
                            Copy CSS
                        </Button>
                        <Button variant="default" size="sm" className="gap-1.5 h-8" onClick={onClose}>
                            <Check className="w-3.5 h-3.5" />
                            Done
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Canvas */}
                <div className="flex-1 bg-muted/30 flex items-center justify-center overflow-auto p-8 relative">
                    {showGrid && (
                        <div
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
                                backgroundSize: "20px 20px"
                            }}
                        />
                    )}
                    <div
                        ref={previewRef}
                        className="bg-white rounded-xl shadow-2xl border border-border flex items-center justify-center relative"
                        style={{
                            width: 400,
                            height: 400,
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'center center'
                        }}
                    >
                        {/* Background Shape */}
                        {effects.backgroundShape !== "none" && (
                            <div
                                className={cn(
                                    "absolute",
                                    effects.backgroundShape === "circle" && "rounded-full",
                                    effects.backgroundShape === "rounded" && "rounded-2xl"
                                )}
                                style={{
                                    width: icon.size + 24,
                                    height: icon.size + 24,
                                    backgroundColor: effects.backgroundColor,
                                    boxShadow: effects.shadow > 0 ? `0 ${effects.shadow}px ${effects.shadow * 2}px rgba(0,0,0,0.2)` : "none"
                                }}
                            />
                        )}

                        {/* Icon */}
                        <div
                            style={{
                                width: icon.size,
                                height: icon.size,
                                transform: `rotate(${icon.rotation}deg) scaleX(${effects.flipX ? -1 : 1}) scaleY(${effects.flipY ? -1 : 1})`,
                                opacity: icon.opacity,
                                filter: getFilterStyle(),
                                transition: 'all 0.15s ease',
                                boxShadow: effects.backgroundShape === "none" && effects.shadow > 0 ? `0 ${effects.shadow}px ${effects.shadow * 2}px rgba(0,0,0,0.3)` : "none"
                            }}
                        >
                            {icon.icon.url ? (
                                <img
                                    src={icon.icon.url}
                                    alt={icon.icon.name}
                                    className="w-full h-full object-contain"
                                    draggable={false}
                                />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox={`0 0 ${icon.icon.width || 24} ${icon.icon.height || 24}`}
                                    fill="currentColor"
                                    className="w-full h-full"
                                    dangerouslySetInnerHTML={{ __html: icon.icon.body || '' }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Presets Bar */}
                <div className="h-14 border-t border-border bg-card/50 flex items-center gap-2 px-4 overflow-x-auto">
                    <span className="text-xs text-muted-foreground shrink-0">Presets:</span>
                    {PRESETS.map(preset => (
                        <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs shrink-0"
                            onClick={() => applyPreset(preset)}
                        >
                            {preset.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-72 border-l border-border bg-card flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab("transform")}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-medium transition-colors",
                            activeTab === "transform" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Transform
                    </button>
                    <button
                        onClick={() => setActiveTab("effects")}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-medium transition-colors",
                            activeTab === "effects" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Effects
                    </button>
                    <button
                        onClick={() => setActiveTab("position")}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-medium transition-colors",
                            activeTab === "position" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Position
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Transform Tab */}
                    {activeTab === "transform" && (
                        <div className="p-4 space-y-4">
                            {/* Size */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" /> Size
                                    </Label>
                                    <Input
                                        type="number"
                                        value={icon.size}
                                        onChange={(e) => !locked && onUpdate({ size: Number(e.target.value) })}
                                        className="w-16 h-6 text-xs text-right"
                                        disabled={locked}
                                    />
                                </div>
                                <Slider
                                    value={[icon.size]}
                                    onValueChange={([value]) => !locked && onUpdate({ size: value })}
                                    min={16}
                                    max={256}
                                    step={4}
                                    disabled={locked}
                                />
                            </div>

                            {/* Rotation */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <RotateCw className="w-3.5 h-3.5 text-muted-foreground" /> Rotation
                                    </Label>
                                    <Input
                                        type="number"
                                        value={icon.rotation}
                                        onChange={(e) => !locked && onUpdate({ rotation: Number(e.target.value) % 360 })}
                                        className="w-16 h-6 text-xs text-right"
                                        disabled={locked}
                                    />
                                </div>
                                <Slider
                                    value={[icon.rotation]}
                                    onValueChange={([value]) => !locked && onUpdate({ rotation: value })}
                                    min={0}
                                    max={360}
                                    step={1}
                                    disabled={locked}
                                />
                            </div>

                            {/* Opacity */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Opacity
                                    </Label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{Math.round(icon.opacity * 100)}%</span>
                                </div>
                                <Slider
                                    value={[icon.opacity * 100]}
                                    onValueChange={([value]) => !locked && onUpdate({ opacity: value / 100 })}
                                    min={10}
                                    max={100}
                                    step={5}
                                    disabled={locked}
                                />
                            </div>

                            {/* Layers */}
                            <div className="pt-2 border-t border-border space-y-2">
                                <Label className="flex items-center gap-1.5 text-xs">
                                    <Layers className="w-3.5 h-3.5 text-muted-foreground" /> Layer Order
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={bringToFront}>
                                        <ChevronUp className="w-3 h-3" /> Front
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={sendToBack}>
                                        <ChevronDown className="w-3 h-3" /> Back
                                    </Button>
                                </div>
                            </div>

                            {/* Alignment */}
                            <div className="pt-2 border-t border-border space-y-2">
                                <Label className="text-xs">Alignment</Label>
                                <div className="grid grid-cols-3 gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={alignLeft} disabled={locked}>
                                        <AlignLeft className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={alignCenterH} disabled={locked}>
                                        <AlignCenter className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={alignRight} disabled={locked}>
                                        <AlignRight className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={alignTop} disabled={locked}>
                                        <AlignStartVertical className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={alignCenterV} disabled={locked}>
                                        <AlignCenterVertical className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={alignBottom} disabled={locked}>
                                        <AlignEndVertical className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Effects Tab */}
                    {activeTab === "effects" && (
                        <div className="p-4 space-y-4">
                            {/* Shadow */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <Droplets className="w-3.5 h-3.5 text-muted-foreground" /> Shadow
                                    </Label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{effects.shadow}px</span>
                                </div>
                                <Slider
                                    value={[effects.shadow]}
                                    onValueChange={([value]) => setEffects(e => ({ ...e, shadow: value }))}
                                    min={0}
                                    max={30}
                                    step={1}
                                />
                            </div>

                            {/* Blur */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <Wind className="w-3.5 h-3.5 text-muted-foreground" /> Blur
                                    </Label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{effects.blur}px</span>
                                </div>
                                <Slider
                                    value={[effects.blur]}
                                    onValueChange={([value]) => setEffects(e => ({ ...e, blur: value }))}
                                    min={0}
                                    max={20}
                                    step={1}
                                />
                            </div>

                            {/* Brightness */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <Sun className="w-3.5 h-3.5 text-muted-foreground" /> Brightness
                                    </Label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{effects.brightness}%</span>
                                </div>
                                <Slider
                                    value={[effects.brightness]}
                                    onValueChange={([value]) => setEffects(e => ({ ...e, brightness: value }))}
                                    min={50}
                                    max={150}
                                    step={5}
                                />
                            </div>

                            {/* Contrast */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <Contrast className="w-3.5 h-3.5 text-muted-foreground" /> Contrast
                                    </Label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{effects.contrast}%</span>
                                </div>
                                <Slider
                                    value={[effects.contrast]}
                                    onValueChange={([value]) => setEffects(e => ({ ...e, contrast: value }))}
                                    min={50}
                                    max={150}
                                    step={5}
                                />
                            </div>

                            {/* Saturation */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-xs">
                                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" /> Saturation
                                    </Label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{effects.saturate}%</span>
                                </div>
                                <Slider
                                    value={[effects.saturate]}
                                    onValueChange={([value]) => setEffects(e => ({ ...e, saturate: value }))}
                                    min={0}
                                    max={200}
                                    step={10}
                                />
                            </div>

                            {/* Grayscale Toggle */}
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <Label className="flex items-center gap-1.5 text-xs">
                                    <Moon className="w-3.5 h-3.5 text-muted-foreground" /> Grayscale
                                </Label>
                                <Switch
                                    checked={effects.grayscale}
                                    onCheckedChange={(checked) => setEffects(e => ({ ...e, grayscale: checked }))}
                                />
                            </div>

                            {/* Background Shape */}
                            <div className="pt-2 border-t border-border space-y-2">
                                <Label className="text-xs">Background Shape</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={effects.backgroundShape === "none" ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1 h-8 text-xs"
                                        onClick={() => setEffects(e => ({ ...e, backgroundShape: "none" }))}
                                    >
                                        None
                                    </Button>
                                    <Button
                                        variant={effects.backgroundShape === "square" ? "default" : "outline"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEffects(e => ({ ...e, backgroundShape: "square" }))}
                                    >
                                        <Square className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant={effects.backgroundShape === "rounded" ? "default" : "outline"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEffects(e => ({ ...e, backgroundShape: "rounded" }))}
                                    >
                                        <Hexagon className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant={effects.backgroundShape === "circle" ? "default" : "outline"}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEffects(e => ({ ...e, backgroundShape: "circle" }))}
                                    >
                                        <Circle className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {effects.backgroundShape !== "none" && (
                                    <div className="grid grid-cols-5 gap-1 pt-2">
                                        {BACKGROUND_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setEffects(e => ({ ...e, backgroundColor: color }))}
                                                className={cn(
                                                    "w-full aspect-square rounded border-2",
                                                    effects.backgroundColor === color ? "border-primary" : "border-transparent",
                                                    color === "#ffffff" && "border-border"
                                                )}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Position Tab */}
                    {activeTab === "position" && (
                        <div className="p-4 space-y-4">
                            {/* X Position */}
                            <div className="space-y-2">
                                <Label className="text-xs">X Position</Label>
                                <Input
                                    type="number"
                                    value={Math.round(icon.x)}
                                    onChange={(e) => !locked && onUpdate({ x: Number(e.target.value) })}
                                    disabled={locked}
                                />
                            </div>

                            {/* Y Position */}
                            <div className="space-y-2">
                                <Label className="text-xs">Y Position</Label>
                                <Input
                                    type="number"
                                    value={Math.round(icon.y)}
                                    onChange={(e) => !locked && onUpdate({ y: Number(e.target.value) })}
                                    disabled={locked}
                                />
                            </div>

                            <p className="text-[10px] text-muted-foreground">
                                Tip: Use arrow keys to nudge by 1px, or Shift+Arrow for 10px
                            </p>

                            {/* Quick Position */}
                            <div className="pt-2 border-t border-border space-y-2">
                                <Label className="text-xs">Quick Position</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 20, y: 20 })}>
                                        Top Left
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 300 - icon.size / 2, y: 20 })}>
                                        Top Center
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 580 - icon.size, y: 20 })}>
                                        Top Right
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 20, y: 200 - icon.size / 2 })}>
                                        Mid Left
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 300 - icon.size / 2, y: 200 - icon.size / 2 })}>
                                        Center
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 580 - icon.size, y: 200 - icon.size / 2 })}>
                                        Mid Right
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 20, y: 380 - icon.size })}>
                                        Bot Left
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 300 - icon.size / 2, y: 380 - icon.size })}>
                                        Bot Center
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => onUpdate({ x: 580 - icon.size, y: 380 - icon.size })}>
                                        Bot Right
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 space-y-2 border-t border-border">
                    <Button variant="outline" className="w-full gap-2 h-9" onClick={downloadIcon}>
                        <Download className="w-4 h-4" /> Download Icon
                    </Button>
                    <Button variant="outline" className="w-full gap-2 h-9" onClick={handleDuplicate}>
                        <Copy className="w-4 h-4" /> Duplicate
                    </Button>
                    <Button variant="destructive" className="w-full gap-2 h-9" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                </div>
            </div>
        </div>
    )
}
