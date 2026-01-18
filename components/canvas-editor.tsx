"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
    X, ZoomIn, ZoomOut, Download, Check, Trash2, Copy,
    Layers, ChevronUp, ChevronDown, ChevronLeft, Eye, EyeOff, Lock, Unlock, Grid3X3,
    Move, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
    AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    Sun, Contrast, Droplets, Sparkles, Maximize2, RefreshCw,
    Type, Pencil, Square, Circle, Minus, Plus, Eraser, Pipette,
    Bold, Italic, Underline, AlignJustify, ImagePlus, Wand2, AlertTriangle, FileImage, FileType, Settings2,
    Users, PlusSquare, MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { CanvasIcon, TextElement, ImageElement, ShapeElement, IconData } from "@/types/icon"
import type { CanvasSlide } from "@/types/slide"
import { createBlankSlide } from "@/types/slide"
import type { SyncedCanvasState } from "@/types/collaboration"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { EditorChatPanel } from "@/components/editor-chat-panel"
import { SlidePanel } from "@/components/slide-panel"
import { EditorCollabControls } from "@/components/editor-collab-controls"
import { GroupModal } from "@/components/group-modal"
import { MemberCursors } from "@/components/member-cursors"
import { useCollaborationSafe } from "@/lib/collaboration-context"
import JSZip from "jszip"
import { IconSearchPanel } from "@/components/icon-search-panel"
import { Search } from "lucide-react"

interface CanvasEditorProps {
    icons: CanvasIcon[]
    selectedIconId: string | null
    onSelectIcon: (id: string | null) => void
    onUpdateIcon: (id: string, updates: Partial<CanvasIcon>) => void
    onUpdateAll: (icons: CanvasIcon[]) => void
    onDeleteIcon: (id: string) => void
    onDuplicateIcon: (id: string) => void
    onClose: () => void
    onSave?: (image: string) => void
    isMobile?: boolean
}





const CANVAS_PRESETS = [
    { name: "Default", w: 800, h: 600 },
    { name: "Square", w: 600, h: 600 },
    { name: "Instagram", w: 1080, h: 1080 },
    { name: "Story", w: 1080, h: 1920 },
    { name: "Twitter", w: 1200, h: 675 },
    { name: "YouTube", w: 1280, h: 720 },
    { name: "Logo", w: 512, h: 512 },
    { name: "HD", w: 1920, h: 1080 },
]

const BG_COLORS = [
    "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8",
    "#1e293b", "#0f172a", "#000000", "#fef2f2", "#fee2e2", "#fca5a5",
    "#eff6ff", "#dbeafe", "#93c5fd", "#f0fdf4", "#dcfce7", "#86efac",
    "#fefce8", "#fef9c3", "#fde047", "#fdf4ff", "#fae8ff", "#e879f9",
]

const FONTS = [
    // Modern Sans-serif
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Nunito", "Ubuntu", "Rubik",
    "Work Sans", "Quicksand", "Raleway", "Barlow", "Mulish", "Karla", "Josefin Sans", "Cabin",
    "Bitter", "Archivo", "Fira Sans", "Manrope", "Space Grotesk", "DM Sans", "Outfit",
    "Plus Jakarta Sans", "Noto Sans",
    // Elegant Serif
    "Playfair Display", "Merriweather", "Libre Baskerville", "Crimson Text", "EB Garamond",
    "Spectral", "Georgia", "Times New Roman",
    // Display & Headlines
    "Oswald", "Bebas Neue", "Anton", "Righteous", "Alfa Slab One", "Abril Fatface", "Bangers",
    "Fredoka", "Comfortaa",
    // Script & Handwriting
    "Pacifico", "Dancing Script", "Lobster", "Satisfy", "Great Vibes", "Caveat", "Permanent Marker",
    "Indie Flower", "Amatic SC", "Shadows Into Light",
    // Monospace
    "JetBrains Mono", "Fira Code", "Source Code Pro", "Space Mono", "Courier New"
]





const DRAW_COLORS = [
    "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
]

export function CanvasEditor({
    icons,
    selectedIconId,
    onSelectIcon,
    onUpdateIcon,
    onUpdateAll,
    onDeleteIcon,
    onDuplicateIcon,
    onClose,
    onSave,
    isMobile
}: CanvasEditorProps) {
    // Collaboration
    const collab = useCollaborationSafe()
    const [showChatPanel, setShowChatPanel] = useState(false)
    const [showGroupModal, setShowGroupModal] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const lastMsgCountRef = useRef(0)

    // Track unread messages
    useEffect(() => {
        if (!collab) return
        const count = collab.messages.length
        if (!showChatPanel && count > lastMsgCountRef.current) {
            setUnreadCount(prev => prev + (count - lastMsgCountRef.current))
        }
        if (showChatPanel) {
            setUnreadCount(0)
        }
        lastMsgCountRef.current = count
    }, [collab?.messages.length, showChatPanel])

    // Multi-slide system
    const [slides, setSlides] = useState<CanvasSlide[]>(() => [createBlankSlide("Slide 1")])
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

    // Canvas settings
    const [canvasW, setCanvasW] = useState(800)
    const [canvasH, setCanvasH] = useState(600)
    const [bgColor, setBgColor] = useState("#ffffff")
    const [showGrid, setShowGrid] = useState(false)
    const [gridSize, setGridSize] = useState(20)
    const [zoom, setZoom] = useState(80)

    // Tool state
    const [activeTool, setActiveTool] = useState<"select" | "draw" | "text" | "shape" | "eraser">("select")
    const [drawColor, setDrawColor] = useState("#000000")
    const [drawSize, setDrawSize] = useState(4)

    // Elements
    const [textElements, setTextElements] = useState<TextElement[]>([])
    const [shapeElements, setShapeElements] = useState<ShapeElement[]>([])
    const [imageElements, setImageElements] = useState<ImageElement[]>([])
    const [drawingPaths, setDrawingPaths] = useState<{ points: { x: number, y: number }[], color: string, size: number }[]>([])
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

    // Search State
    const [searchQuery, setSearchQuery] = useState("")
    const [aiSearchQuery, setAiSearchQuery] = useState("")

    // Layer Order (Unified Z-Index)
    const [layerOrder, setLayerOrder] = useState<string[]>([])

    // Exit confirmation dialog
    const [showExitDialog, setShowExitDialog] = useState(false)
    const [showMobileProps, setShowMobileProps] = useState(false)

    // Slide management functions
    const saveCurrentSlide = useCallback(() => {
        setSlides(prev => prev.map((slide, idx) =>
            idx === currentSlideIndex ? {
                ...slide,
                canvasW, canvasH, bgColor,
                icons: [...icons],
                textElements: [...textElements],
                imageElements: [...imageElements],
                shapes: [...shapeElements],
                drawingPaths: [...drawingPaths],
                layerOrder: [...layerOrder]
            } : slide
        ))
    }, [currentSlideIndex, canvasW, canvasH, bgColor, icons, textElements, imageElements, shapeElements, drawingPaths, layerOrder])

    const loadSlide = useCallback((index: number) => {
        const slide = slides[index]
        if (!slide) return
        setCanvasW(slide.canvasW)
        setCanvasH(slide.canvasH)
        setBgColor(slide.bgColor)
        // Note: icons are passed from parent, so we can't directly set them here
        // For now, slide switching primarily affects canvas settings and local elements
        setTextElements(slide.textElements)
        setImageElements(slide.imageElements)
        setShapeElements(slide.shapes || [])
        setDrawingPaths(slide.drawingPaths || [])
        setLayerOrder(slide.layerOrder)
    }, [slides])

    const handleSelectSlide = useCallback((index: number) => {
        if (index === currentSlideIndex) return
        saveCurrentSlide()
        setCurrentSlideIndex(index)
        loadSlide(index)
    }, [currentSlideIndex, saveCurrentSlide, loadSlide])

    const handleAddSlide = useCallback(() => {
        saveCurrentSlide()
        const newSlide = createBlankSlide(`Slide ${slides.length + 1}`)
        setSlides(prev => [...prev, newSlide])
        setCurrentSlideIndex(slides.length)
        // Reset to blank canvas
        setCanvasW(800)
        setCanvasH(600)
        setBgColor("#ffffff")
        setTextElements([])
        setImageElements([])
        setLayerOrder([])
        toast.success("New slide added")
    }, [slides.length, saveCurrentSlide])

    const handleDuplicateSlide = useCallback((index: number) => {
        const slideToDuplicate = slides[index]
        const duplicated: CanvasSlide = {
            ...slideToDuplicate,
            id: `slide-${Date.now()}`,
            name: `${slideToDuplicate.name} (copy)`
        }
        setSlides(prev => [...prev.slice(0, index + 1), duplicated, ...prev.slice(index + 1)])
        toast.success("Slide duplicated")
    }, [slides])

    const handleDeleteSlide = useCallback((index: number) => {
        if (slides.length <= 1) return
        setSlides(prev => prev.filter((_, i) => i !== index))
        if (currentSlideIndex >= slides.length - 1) {
            setCurrentSlideIndex(Math.max(0, slides.length - 2))
        }
        toast.success("Slide deleted")
    }, [slides.length, currentSlideIndex])

    const handleRenameSlide = useCallback((index: number, name: string) => {
        setSlides(prev => prev.map((s, i) => i === index ? { ...s, name } : s))
    }, [])

    // Sync layer order when new elements are added
    // Sync Layer Order
    useEffect(() => {
        setLayerOrder(prev => {
            const currentIds = new Set(prev)
            const newIds: string[] = []

            // Add existing mapped IDs in order
            for (const id of prev) {
                if (icons.find(i => i.id === id) ||
                    textElements.find(t => t.id === id) ||
                    imageElements.find(i => i.id === id) ||
                    shapeElements.find(s => s.id === id)) {
                    newIds.push(id)
                }
            }

            // Append new icons
            icons.forEach(i => { if (!currentIds.has(i.id)) newIds.push(i.id) })
            // Append new text
            textElements.forEach(t => { if (!currentIds.has(t.id)) newIds.push(t.id) })
            // Append new images
            imageElements.forEach(i => { if (!currentIds.has(i.id)) newIds.push(i.id) })
            // Append new shapes
            shapeElements.forEach(s => { if (!currentIds.has(s.id)) newIds.push(s.id) })

            return newIds
        })
    }, [icons.length, textElements.length, imageElements.length, shapeElements.length])

    // Drawing
    const [isDrawing, setIsDrawing] = useState(false)
    // drawingPaths moved up to fix TDZ
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([])

    // Drag state
    const [isDragging, setIsDragging] = useState(false)
    const [dragTarget, setDragTarget] = useState<{ type: "icon" | "text" | "image" | "shape", id: string } | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    // UI state
    const [tab, setTab] = useState<"canvas" | "object" | "effects" | "layers" | "text" | "draw" | "images" | "search">("canvas")
    const [hidden, setHidden] = useState<Set<string>>(new Set())
    const [locked, setLocked] = useState<Set<string>>(new Set())
    const [effects, setEffects] = useState<Record<string, any>>({})

    // Layer Drag State
    const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null)

    const canvasRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragThrottleRef = useRef<number | null>(null)
    const resizeThrottleRef = useRef<number | null>(null)
    const pendingDragUpdate = useRef<{ x: number, y: number } | null>(null)
    const pendingResizeUpdate = useRef<{ size?: number, width?: number, height?: number, x?: number, y?: number } | null>(null)

    // Unified Selection Helper
    const getElementById = (id: string) => {
        const icon = icons.find(i => i.id === id)
        if (icon) return { type: "icon" as const, element: icon }
        const text = textElements.find(t => t.id === id)
        if (text) return { type: "text" as const, element: text }
        const img = imageElements.find(i => i.id === id)
        if (img) return { type: "image" as const, element: img }
        const shape = shapeElements.find(s => s.id === id)
        if (shape) return { type: "shape" as const, element: shape }
        return null
    }

    const selected = icons.find(i => i.id === selectedIconId)
    const selectedText = textElements.find(t => t.id === selectedTextId)
    const selectedImage = imageElements.find(i => i.id === selectedImageId)
    const selectedShape = shapeElements.find(s => s.id === selectedShapeId)

    // Unified Selected ID
    const currentSelectedId = selectedIconId || selectedTextId || selectedImageId || selectedShapeId

    const getEffects = (id: string) => effects[id] || {
        shadow: 0, blur: 0, brightness: 100, contrast: 100, saturate: 100,
        grayscale: false, flipX: false, flipY: false
    }

    const setEffect = (id: string, key: string, val: any) => {
        setEffects(p => ({ ...p, [id]: { ...getEffects(id), [key]: val } }))
    }

    const fitZoom = useCallback(() => {
        const maxW = window.innerWidth - (isMobile ? 0 : 420)
        const maxH = window.innerHeight - 120
        const scale = Math.min(maxW / canvasW, maxH / canvasH, 1)
        setZoom(Math.round(scale * 100))
    }, [canvasW, canvasH, isMobile])

    useEffect(() => { fitZoom() }, [canvasW, canvasH])

    // Drawing handlers
    const startDraw = (e: React.MouseEvent) => {
        if (activeTool !== "draw" && activeTool !== "eraser") return
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left) / (zoom / 100)
        const y = (e.clientY - rect.top) / (zoom / 100)
        setIsDrawing(true)
        setCurrentPath([{ x, y }])
    }

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left) / (zoom / 100)
        const y = (e.clientY - rect.top) / (zoom / 100)
        setCurrentPath(p => [...p, { x, y }])
    }

    const endDraw = () => {
        if (!isDrawing) return
        setIsDrawing(false)
        if (currentPath.length > 1) {
            setDrawingPaths(p => [...p, {
                points: currentPath,
                color: activeTool === "eraser" ? bgColor : drawColor,
                size: activeTool === "eraser" ? drawSize * 3 : drawSize
            }])
        }
        setCurrentPath([])
    }

    // Add text
    const addText = () => {
        const newText: TextElement = {
            id: `text-${Date.now()}`,
            text: "Double click to edit",
            x: canvasW / 2 - 100,
            y: canvasH / 2,
            fontSize: 24,
            fontFamily: "Inter",
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            color: "#000000",
            textAlign: "left",
            opacity: 1,
            rotation: 0
        }
        setTextElements(p => [...p, newText])
        setSelectedTextId(newText.id)
        setTab("text")
        toast.success("Text added")
    }

    // Update text
    const updateText = (id: string, updates: Partial<TextElement>) => {
        setTextElements(p => p.map(t => t.id === id ? { ...t, ...updates } : t))
    }

    // Delete text
    const deleteText = (id: string) => {
        setTextElements(p => p.filter(t => t.id !== id))
        if (selectedTextId === id) setSelectedTextId(null)
    }

    // Image handling
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new window.Image()
            img.onload = () => {
                const newImage: ImageElement = {
                    id: `img-${Date.now()}`,
                    src: event.target?.result as string,
                    x: canvasW / 2 - Math.min(img.width, 200) / 2,
                    y: canvasH / 2 - Math.min(img.height, 200) / 2,
                    width: Math.min(img.width, 200),
                    height: Math.min(img.height, 200),
                    opacity: 1,
                    rotation: 0
                }
                setImageElements(p => [...p, newImage])
                setSelectedImageId(newImage.id)
                setTab("images")
                toast.success("Image added")
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
        e.target.value = ""
    }

    const updateImage = (id: string, updates: Partial<ImageElement>) => {
        setImageElements(p => p.map(i => i.id === id ? { ...i, ...updates } : i))
    }

    const deleteImage = (id: string) => {
        setImageElements(p => p.filter(i => i.id !== id))
        if (selectedImageId === id) setSelectedImageId(null)
    }

    const addShape = (type: ShapeElement["type"]) => {
        const newShape: ShapeElement = {
            id: `shape-${Date.now()}`,
            type,
            x: canvasW / 2 - 50,
            y: canvasH / 2 - 50,
            width: 100,
            height: 100,
            fill: "#3b82f6",
            stroke: "none",
            strokeWidth: 0,
            opacity: 100,
            rotation: 0,
            cornerRadius: type === "rect" ? 0 : undefined,
            points: type === "star" ? 5 : undefined
        }
        setShapeElements([...shapeElements, newShape])
        setSelectedShapeId(newShape.id)
        setSelectedTextId(null)
        onSelectIcon(null)
        setSelectedImageId(null)
        setTab("object")
    }

    const updateShape = (id: string, updates: Partial<ShapeElement>) => {
        setShapeElements(p => p.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const deleteShape = (id: string) => {
        setShapeElements(p => p.filter(s => s.id !== id))
        if (selectedShapeId === id) setSelectedShapeId(null)
    }

    // Drag handlers
    const handleDragStart = (e: React.MouseEvent, type: "icon" | "text" | "image" | "shape", id: string, elementX: number, elementY: number) => {
        if (activeTool !== "select") return
        e.stopPropagation()
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const mouseX = (e.clientX - rect.left) / (zoom / 100)
        const mouseY = (e.clientY - rect.top) / (zoom / 100)
        setIsDragging(true)
        setDragTarget({ type, id })
        setDragOffset({ x: mouseX - elementX, y: mouseY - elementY })

        if (type === "icon") {
            onSelectIcon(id)
            setSelectedTextId(null)
            setSelectedImageId(null)
            setSelectedShapeId(null)
        } else if (type === "text") {
            setSelectedTextId(id)
            onSelectIcon(null)
            setSelectedImageId(null)
            setSelectedShapeId(null)
        } else if (type === "image") {
            setSelectedImageId(id)
            onSelectIcon(null)
            setSelectedTextId(null)
            setSelectedShapeId(null)
        } else if (type === "shape") {
            setSelectedShapeId(id)
            onSelectIcon(null)
            setSelectedTextId(null)
            setSelectedImageId(null)
        }
    }

    const handleAddIconFromSearch = (iconData: IconData) => {
        const newIcon: CanvasIcon = {
            id: `icon-${Date.now()}`,
            icon: iconData,
            x: canvasW / 2 - 50,
            y: canvasH / 2 - 50,
            size: 100,
            color: "#000000",
            rotation: 0,
            opacity: 1
        }
        onUpdateAll([...icons, newIcon])
        toast.success("Icon added")
        setTab("object")
    }

    const handleDrag = (e: React.MouseEvent) => {
        if (!isDragging || !dragTarget) return
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const mouseX = (e.clientX - rect.left) / (zoom / 100)
        const mouseY = (e.clientY - rect.top) / (zoom / 100)
        const newX = Math.max(0, Math.min(canvasW - 50, mouseX - dragOffset.x))
        const newY = Math.max(0, Math.min(canvasH - 50, mouseY - dragOffset.y))

        // Store pending update
        pendingDragUpdate.current = { x: newX, y: newY }

        // Throttle actual state updates
        if (dragThrottleRef.current === null) {
            dragThrottleRef.current = requestAnimationFrame(() => {
                dragThrottleRef.current = null
                const update = pendingDragUpdate.current
                if (!update || !dragTarget) return

                if (dragTarget.type === "icon") {
                    onUpdateIcon(dragTarget.id, { x: update.x, y: update.y })
                } else if (dragTarget.type === "text") {
                    updateText(dragTarget.id, { x: update.x, y: update.y })
                } else if (dragTarget.type === "image") {
                    updateImage(dragTarget.id, { x: update.x, y: update.y })
                } else if (dragTarget.type === "shape") {
                    updateShape(dragTarget.id, { x: update.x, y: update.y })
                }
            })
        }
    }

    const handleDragEnd = () => {
        // Cancel any pending RAF
        if (dragThrottleRef.current) {
            cancelAnimationFrame(dragThrottleRef.current)
            dragThrottleRef.current = null
        }
        // Apply final position if pending
        const update = pendingDragUpdate.current
        if (update && dragTarget) {
            if (dragTarget.type === "icon") {
                onUpdateIcon(dragTarget.id, { x: update.x, y: update.y })
            } else if (dragTarget.type === "text") {
                updateText(dragTarget.id, { x: update.x, y: update.y })
            } else if (dragTarget.type === "image") {
                updateImage(dragTarget.id, { x: update.x, y: update.y })
            } else if (dragTarget.type === "shape") {
                updateShape(dragTarget.id, { x: update.x, y: update.y })
            }
        }
        pendingDragUpdate.current = null
        setIsDragging(false)
        setDragTarget(null)
    }

    // Alignment
    const align = (type: string) => {
        if (!selected || locked.has(selected.id)) return
        const updates: Partial<CanvasIcon> = {}
        if (type === "left") updates.x = 0
        if (type === "centerH") updates.x = (canvasW - selected.size) / 2
        if (type === "right") updates.x = canvasW - selected.size
        if (type === "top") updates.y = 0
        if (type === "centerV") updates.y = (canvasH - selected.size) / 2
        if (type === "bottom") updates.y = canvasH - selected.size
        onUpdateIcon(selected.id, updates)
    }

    // Resize state
    const [isResizing, setIsResizing] = useState(false)
    const [resizeDirection, setResizeDirection] = useState<string | null>(null)
    const [initialResizeState, setInitialResizeState] = useState<{
        width: number, height: number, x: number, y: number, mouseX: number, mouseY: number
    } | null>(null)

    const handleResizeStart = (e: React.MouseEvent, direction: string, type: "icon" | "image" | "shape", id: string) => {
        e.stopPropagation()
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const mouseX = e.clientX
        const mouseY = e.clientY

        let initialW = 0, initialH = 0, initialX = 0, initialY = 0

        if (type === "icon") {
            const icon = icons.find(i => i.id === id)
            if (icon) {
                initialW = icon.size
                initialH = icon.size
                initialX = icon.x
                initialY = icon.y
            }
        } else if (type === "image") {
            const img = imageElements.find(i => i.id === id)
            if (img) {
                initialW = img.width
                initialH = img.height
                initialX = img.x
                initialY = img.y
            }
        } else if (type === "shape") {
            const shape = shapeElements.find(s => s.id === id)
            if (shape) {
                initialW = shape.width
                initialH = shape.height
                initialX = shape.x
                initialY = shape.y
            }
        }

        setIsResizing(true)
        setResizeDirection(direction)
        setInitialResizeState({ width: initialW, height: initialH, x: initialX, y: initialY, mouseX, mouseY })
        setDragTarget({ type, id }) // Reuse drag target for ID tracking
    }

    const handleResize = (e: React.MouseEvent) => {
        if (!isResizing || !initialResizeState || !dragTarget || !resizeDirection) return
        e.stopPropagation()
        e.preventDefault()

        const dx = (e.clientX - initialResizeState.mouseX) / (zoom / 100)
        const dy = (e.clientY - initialResizeState.mouseY) / (zoom / 100)

        let newW = initialResizeState.width
        let newH = initialResizeState.height
        let newX = initialResizeState.x
        let newY = initialResizeState.y

        if (dragTarget.type === "icon") {
            if (resizeDirection.includes("e")) newW += dx
            if (resizeDirection.includes("w")) { newW -= dx; newX += dx }
            if (resizeDirection.includes("s")) newH += dy
            if (resizeDirection.includes("n")) { newH -= dy; newY += dy }

            const size = Math.max(10, Math.max(newW, newH))

            if (resizeDirection.includes("w")) newX = initialResizeState.x + (initialResizeState.width - size)
            if (resizeDirection.includes("n")) newY = initialResizeState.y + (initialResizeState.height - size)

            pendingResizeUpdate.current = { size, x: newX, y: newY }

        } else if (dragTarget.type === "image" || dragTarget.type === "shape") {
            if (resizeDirection.includes("e")) newW += dx
            if (resizeDirection.includes("w")) { newW -= dx; newX += dx }
            if (resizeDirection.includes("s")) newH += dy
            if (resizeDirection.includes("n")) { newH -= dy; newY += dy }

            const w = Math.max(10, newW)
            const h = Math.max(10, newH)

            pendingResizeUpdate.current = { width: w, height: h, x: newX, y: newY }
        }

        // Throttle actual state updates
        if (resizeThrottleRef.current === null) {
            resizeThrottleRef.current = requestAnimationFrame(() => {
                resizeThrottleRef.current = null
                const update = pendingResizeUpdate.current
                if (!update || !dragTarget) return

                if (dragTarget.type === "icon" && update.size !== undefined) {
                    onUpdateIcon(dragTarget.id, { size: update.size, x: update.x, y: update.y })
                } else if (dragTarget.type === "image") {
                    updateImage(dragTarget.id, { width: update.width, height: update.height, x: update.x, y: update.y })
                } else if (dragTarget.type === "shape") {
                    updateShape(dragTarget.id, { width: update.width, height: update.height, x: update.x, y: update.y })
                }
            })
        }
    }

    const handleResizeEnd = () => {
        // Cancel any pending RAF
        if (resizeThrottleRef.current) {
            cancelAnimationFrame(resizeThrottleRef.current)
            resizeThrottleRef.current = null
        }
        // Apply final update if pending
        const update = pendingResizeUpdate.current
        if (update && dragTarget) {
            if (dragTarget.type === "icon" && update.size !== undefined) {
                onUpdateIcon(dragTarget.id, { size: update.size, x: update.x, y: update.y })
            } else if (dragTarget.type === "image") {
                updateImage(dragTarget.id, { width: update.width, height: update.height, x: update.x, y: update.y })
            } else if (dragTarget.type === "shape") {
                updateShape(dragTarget.id, { width: update.width, height: update.height, x: update.x, y: update.y })
            }
        }
        pendingResizeUpdate.current = null
        setIsResizing(false)
        setResizeDirection(null)
        setInitialResizeState(null)
        setDragTarget(null)
    }

    const renderToContext = async (
        ctx: CanvasRenderingContext2D,
        scale: number,
        state?: {
            icons: CanvasIcon[],
            textElements: TextElement[],
            imageElements: ImageElement[],
            shapeElements: ShapeElement[],
            drawingPaths: typeof drawingPaths,
            layerOrder: string[],
            bgColor: string
        }
    ) => {
        const _icons = state?.icons ?? icons
        const _textElements = state?.textElements ?? textElements
        const _imageElements = state?.imageElements ?? imageElements
        const _shapeElements = state?.shapeElements ?? shapeElements
        const _drawingPaths = state?.drawingPaths ?? drawingPaths
        const _layerOrder = state?.layerOrder ?? layerOrder
        const _bgColor = state?.bgColor ?? bgColor

        // Background
        ctx.fillStyle = _bgColor
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        // Drawing paths
        for (const path of _drawingPaths) {
            if (path.points.length < 2) continue
            ctx.beginPath()
            ctx.strokeStyle = path.color
            ctx.lineWidth = path.size * scale
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.moveTo(path.points[0].x * scale, path.points[0].y * scale)
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x * scale, path.points[i].y * scale)
            }
            ctx.stroke()
        }

        // Unified Export Loop
        for (const id of _layerOrder) {
            if (hidden.has(id)) continue

            // Resolve element from ID
            let type: "icon" | "text" | "image" | "shape" | null = null
            let element: any = null

            const icon = _icons.find(i => i.id === id)
            if (icon) { type = "icon"; element = icon }
            else {
                const text = _textElements.find(t => t.id === id)
                if (text) { type = "text"; element = text }
                else {
                    const img = _imageElements.find(i => i.id === id)
                    if (img) { type = "image"; element = img }
                    else {
                        const shape = _shapeElements.find(s => s.id === id)
                        if (shape) { type = "shape"; element = shape }
                    }
                }
            }

            if (!type || !element) continue

            if (type === "icon") {
                const icon = element as CanvasIcon
                if (!icon.icon.url) continue
                const e = getEffects(icon.id)
                await new Promise<void>(resolve => {
                    const img = new window.Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        ctx.save()
                        ctx.globalAlpha = icon.opacity
                        ctx.translate((icon.x + icon.size / 2) * scale, (icon.y + icon.size / 2) * scale)
                        ctx.rotate(icon.rotation * Math.PI / 180)
                        ctx.scale(e.flipX ? -1 : 1, e.flipY ? -1 : 1)
                        ctx.drawImage(img, -icon.size / 2 * scale, -icon.size / 2 * scale, icon.size * scale, icon.size * scale)
                        ctx.restore()
                        resolve()
                    }
                    img.onerror = () => resolve()
                    img.src = icon.icon.url!
                })
            } else if (type === "image") {
                const imgEl = element as ImageElement
                await new Promise<void>(resolve => {
                    const img = new window.Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        ctx.save()
                        ctx.globalAlpha = imgEl.opacity
                        // Adjust logic if x/y assumes center or top-left. DOM logic assumes top-left.
                        // Translate to center for rotation
                        const centerX = imgEl.x + imgEl.width / 2
                        const centerY = imgEl.y + imgEl.height / 2
                        ctx.translate(centerX * scale, centerY * scale)
                        ctx.rotate(imgEl.rotation * Math.PI / 180)
                        ctx.drawImage(img, -imgEl.width / 2 * scale, -imgEl.height / 2 * scale, imgEl.width * scale, imgEl.height * scale)
                        ctx.restore()
                        resolve()
                    }
                    img.onerror = () => resolve()
                    img.src = imgEl.src
                })
            } else if (type === "shape") {
                const shape = element as ShapeElement
                ctx.save()
                ctx.globalAlpha = shape.opacity / 100
                const x = shape.x * scale
                const y = shape.y * scale
                const w = shape.width * scale
                const h = shape.height * scale
                const r = shape.rotation * Math.PI / 180
                const centerX = x + w / 2
                const centerY = y + h / 2

                ctx.translate(centerX, centerY)
                ctx.rotate(r)
                ctx.translate(-centerX, -centerY)

                ctx.beginPath()
                if (shape.type === "circle") {
                    ctx.ellipse(centerX, centerY, w / 2, h / 2, 0, 0, 2 * Math.PI)
                } else {
                    const radius = (shape.cornerRadius || 0) * scale
                    if ((ctx as any).roundRect) {
                        (ctx as any).roundRect(x, y, w, h, radius)
                    } else {
                        ctx.rect(x, y, w, h)
                    }
                }

                if (shape.fill && shape.fill !== "none") {
                    ctx.fillStyle = shape.fill
                    ctx.fill()
                }
                if (shape.stroke && shape.stroke !== "none" && shape.strokeWidth > 0) {
                    ctx.strokeStyle = shape.stroke
                    ctx.lineWidth = shape.strokeWidth * scale
                    ctx.stroke()
                }
                ctx.restore()
            } else if (type === "text") {
                const t = element as TextElement
                ctx.save()
                ctx.globalAlpha = t.opacity
                ctx.translate(t.x * scale, t.y * scale)
                ctx.rotate(t.rotation * Math.PI / 180)
                ctx.font = `${t.fontStyle} ${t.fontWeight} ${t.fontSize * scale}px ${t.fontFamily}`
                ctx.fillStyle = t.color

                // Simulate simple CSS effects for Canvas export
                if (t.effect === "shadow-multiple" || t.effect === "3d-float" || t.effect === "emboss") {
                    ctx.shadowColor = "rgba(0,0,0,0.5)"
                    ctx.shadowBlur = 4 * scale
                    ctx.shadowOffsetX = 2 * scale
                    ctx.shadowOffsetY = 2 * scale
                } else if (t.effect === "neon") {
                    ctx.shadowColor = t.color
                    ctx.shadowBlur = 10 * scale
                    ctx.shadowOffsetX = 0
                    ctx.shadowOffsetY = 0
                } else if (t.effect === "fire") {
                    ctx.shadowColor = "orange"
                    ctx.shadowBlur = 4 * scale
                    ctx.shadowOffsetY = -4 * scale
                } else if (t.effect === "anaglyph") {
                    ctx.shadowColor = "cyan"
                    ctx.shadowOffsetX = -2 * scale
                    ctx.shadowOffsetY = 0
                }

                if ((t.strokeWidth && t.strokeWidth > 0) || t.effect === "outline") {
                    ctx.strokeStyle = t.strokeColor || (t.effect === "outline" ? t.color : "#000000")
                    ctx.lineWidth = (t.strokeWidth || 1) * scale
                    if (t.effect === "outline") {
                        ctx.strokeStyle = "white"
                        if (t.color === "#ffffff" || t.color === "white") ctx.strokeStyle = "black"
                        ctx.lineWidth = 2 * scale
                    }
                    if (t.strokeColor) ctx.strokeStyle = t.strokeColor

                    ctx.strokeText(t.text, 0, 0)
                }

                ctx.textAlign = t.textAlign as CanvasTextAlign
                ctx.fillText(t.text, 0, 0)

                // Second pass for Anaglyph red component if needed
                if (t.effect === "anaglyph") {
                    ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
                    ctx.fillText(t.text, 2 * scale, 0)
                }

                ctx.restore()
            }
        }
    }

    // Export single slide
    const exportCanvas = async (format: string, scale: number) => {
        const c = document.createElement("canvas")
        const ctx = c.getContext("2d")
        if (!ctx) return
        c.width = canvasW * scale
        c.height = canvasH * scale

        await renderToContext(ctx, scale)

        const a = document.createElement("a")
        a.download = `canvas.${format}`
        a.href = c.toDataURL(`image/${format === "jpg" ? "jpeg" : format}`, 0.95)
        a.click()
        toast.success(`Exported ${format.toUpperCase()}`)
    }

    const downloadZip = async () => {
        toast.loading("Generating ZIP...")
        const zip = new JSZip()

        // Ensure current slide is saved to updated state
        // (saveCurrentSlide uses default logic, handled by effect or sync?)
        // We'll trust `slides` array is mostly up to date, 
        // BUT current slide changes might not be in `slides` yet if we didn't switch away.
        // We need to construct current slide data from current state.

        const currentSlideData = {
            id: slides[currentSlideIndex].id,
            name: slides[currentSlideIndex].name,
            canvasW, canvasH, bgColor,
            icons, textElements, imageElements, shapes: shapeElements,
            drawingPaths, layerOrder
        }

        const allSlidesToExport = slides.map((s, i) => i === currentSlideIndex ? currentSlideData : s)

        for (let i = 0; i < allSlidesToExport.length; i++) {
            const slide = allSlidesToExport[i]
            const scale = 2
            const c = document.createElement("canvas")
            c.width = slide.canvasW * scale
            c.height = slide.canvasH * scale
            const ctx = c.getContext("2d")

            if (ctx) {
                await renderToContext(ctx, scale, {
                    icons: slide.icons, // Note: slide icons might differ from prop icons if parent logic differs. 
                    // We assume slide.icons is populated correctly (see `saveCurrentSlide` fix).
                    // Wait, `saveCurrentSlide` saves `[...icons]` (which are props).
                    // So `slide.icons` ARE the props icons at time of save. 
                    // This creates a snapshot. Correct.
                    textElements: slide.textElements,
                    imageElements: slide.imageElements,
                    shapeElements: slide.shapes || [],
                    drawingPaths: slide.drawingPaths || [],
                    layerOrder: slide.layerOrder,
                    bgColor: slide.bgColor
                })

                await new Promise<void>(resolve => {
                    c.toBlob(blob => {
                        if (blob) {
                            zip.file(`${slide.name || `Slide ${i + 1}`}.png`, blob)
                        }
                        resolve()
                    })
                })
            }
        }

        const content = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(content)
        const a = document.createElement("a")
        a.href = url
        a.download = `presentation-${Date.now()}.zip` // User requested "one canvas? ... download all"
        a.click()
        URL.revokeObjectURL(url)
        toast.dismiss()
        toast.success("Downloaded ZIP")
        setShowExitDialog(false)
    }

    // Export all formats from dialog
    const exportAllFormats = async (format: "png" | "jpg" | "webp" | "zip") => {
        if (format === "zip") {
            await downloadZip()
            return
        }

        const scale = 2 // High quality export
        const c = document.createElement("canvas")
        const ctx = c.getContext("2d")
        if (!ctx) return
        c.width = canvasW * scale
        c.height = canvasH * scale

        await renderToContext(ctx, scale)

        const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`
        const a = document.createElement("a")
        a.download = `icony-canvas-${Date.now()}.${format}`
        a.href = c.toDataURL(mimeType, 0.95)
        a.click()
        toast.success(`Downloaded ${format.toUpperCase()} (${canvasW * scale}x${canvasH * scale})`)
        setShowExitDialog(false)
    }

    // Show exit confirmation dialog (called when Done is clicked)
    const handleDoneClick = () => {
        setShowExitDialog(true)
    }

    // Actually close and save (called from dialog "Continue Anyway")
    const handleDone = async () => {
        setShowExitDialog(false)

        if (!onSave) {
            onClose()
            return
        }

        const scale = 1
        const c = document.createElement("canvas")
        const ctx = c.getContext("2d")
        if (!ctx) return
        c.width = canvasW * scale
        c.height = canvasH * scale

        await renderToContext(ctx, scale)

        // Get data URL
        const dataUrl = c.toDataURL("image/png")
        onSave(dataUrl)
        onClose()
        toast.success("Canvas saved")
    }

    // Clear drawings
    const clearDrawings = () => {
        setDrawingPaths([])
        toast.success("Drawings cleared")
    }

    // Layer Reordering
    const moveLayer = (direction: "front" | "back") => {
        if (!currentSelectedId) return
        const idx = layerOrder.indexOf(currentSelectedId)
        if (idx === -1) return

        const newOrder = [...layerOrder]
        if (direction === "front") {
            if (idx < newOrder.length - 1) {
                newOrder.splice(idx, 1)
                newOrder.push(currentSelectedId) // Bring to front (top)
                setLayerOrder(newOrder)
            }
        } else {
            if (idx > 0) {
                newOrder.splice(idx, 1)
                newOrder.unshift(currentSelectedId) // Send to back (bottom)
                setLayerOrder(newOrder)
            }
        }
    }

    const handleLayerDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedLayerId || draggedLayerId === targetId) return

        const newOrder = [...layerOrder]
        const fromIndex = newOrder.indexOf(draggedLayerId)
        const toIndex = newOrder.indexOf(targetId)

        if (fromIndex !== -1 && toIndex !== -1) {
            newOrder.splice(fromIndex, 1)
            newOrder.splice(toIndex, 0, draggedLayerId)
            setLayerOrder(newOrder)
        }
        setDraggedLayerId(null)
    }

    // Keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
            if (selected && !locked.has(selected.id) && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                const n = e.shiftKey ? 10 : 1
                if (e.key === "ArrowUp") { e.preventDefault(); onUpdateIcon(selected.id, { y: selected.y - n }) }
                if (e.key === "ArrowDown") { e.preventDefault(); onUpdateIcon(selected.id, { y: selected.y + n }) }
                if (e.key === "ArrowLeft") { e.preventDefault(); onUpdateIcon(selected.id, { x: selected.x - n }) }
                if (e.key === "ArrowRight") { e.preventDefault(); onUpdateIcon(selected.id, { x: selected.x + n }) }
                if (e.key === "Delete") { onDeleteIcon(selected.id); onSelectIcon(null) }
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [selected, locked, onClose, onUpdateIcon, onDeleteIcon, onSelectIcon])

    // Sync Logic
    const isRemoteUpdate = useRef(false)
    const lastBroadcast = useRef(0)

    // 1. Receive Updates
    useEffect(() => {
        if (!collab) return

        collab.setOnCanvasUpdate((state) => {
            isRemoteUpdate.current = true

            if (state.canvasSize) {
                setCanvasW(state.canvasSize.width)
                setCanvasH(state.canvasSize.height)
            }
            if (state.backgroundColor) setBgColor(state.backgroundColor)
            if (state.icons) onUpdateAll(state.icons)
            if (state.textElements) setTextElements(state.textElements)
            if (state.imageElements) setImageElements(state.imageElements)
            if (state.shapes) setShapeElements(state.shapes)
            if (state.drawings) {
                setDrawingPaths(state.drawings)
            }
            if (state.layerOrder) setLayerOrder(state.layerOrder)
            if (state.slides) setSlides(state.slides)
            if (state.currentSlideIndex !== undefined) setCurrentSlideIndex(state.currentSlideIndex)
        })

        return () => {
            collab.setOnCanvasUpdate(null)
        }
    }, [collab, onUpdateAll])

    // 2. Broadcast Updates
    useEffect(() => {
        if (!collab?.isConnected) return

        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false
            return
        }

        // Debounce broadcast (100ms) to avoid flooding
        const now = Date.now()
        if (now - lastBroadcast.current < 50) {
            const timer = setTimeout(() => {
                // Determine what changed? For now just broadcast all state to ensure sync
                // Optimally we'd track diffs but for hackathon full state is safer
            }, 50)
            return () => clearTimeout(timer)
        }
        lastBroadcast.current = now

        collab.broadcastCanvasUpdate({
            canvasSize: { width: canvasW, height: canvasH },
            backgroundColor: bgColor,
            icons,
            textElements,
            imageElements,
            shapes: shapeElements,
            drawings: drawingPaths,
            layerOrder,
            slides,
            currentSlideIndex
        })

    }, [
        collab, canvasW, canvasH, bgColor, icons, textElements,
        imageElements, shapeElements, drawingPaths, layerOrder, slides, currentSlideIndex
    ])

    // 3. Cursor Tracking
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!collab?.isConnected || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / (zoom / 100)
        const y = (e.clientY - rect.top) / (zoom / 100)

        collab.updateCursor(x, y)
    }, [collab, zoom])

    const e = selected ? getEffects(selected.id) : null

    return (
        <div className="fixed inset-0 z-[9999] bg-neutral-950 flex flex-col text-white">
            <Header
                title="Icon Editor"
                onBack={onClose}
                rightContent={
                    <div className="flex items-center gap-2">
                        {collab?.isConnected && (
                            <Button
                                variant={showChatPanel ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setShowChatPanel(!showChatPanel)}
                                className="relative"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat
                                {unreadCount > 0 && !showChatPanel && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-950" />
                                )}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="bg-neutral-800 text-white hover:bg-neutral-700" onClick={() => setShowExitDialog(true)}>
                            <Download className="w-4 h-4 mr-2" />Export
                        </Button>
                        <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleDone}>
                            Close
                        </Button>
                    </div>
                }
            />

            <div className={cn("flex-1 flex overflow-hidden relative", isMobile ? "flex-col" : "")}>
                {/* LEFT TOOLBAR */}
                <div className={cn("bg-neutral-900 flex shrink-0", isMobile ? "w-full h-14 border-t border-neutral-800 flex-row items-center px-4 order-last pb-[env(safe-area-inset-bottom)] overflow-x-auto gap-2 [&::-webkit-scrollbar]:hidden" : "w-16 border-r border-neutral-800 flex-col items-center py-4 gap-1")}>
                    <div className="text-[10px] text-neutral-500 mb-2 hidden md:block">Tools</div>

                    <Button variant={activeTool === "select" ? "secondary" : "ghost"} size="icon" className="w-10 h-10" onClick={() => setActiveTool("select")} title="Select">
                        <Move className="w-5 h-5" />
                    </Button>
                    <Button variant={tab === "search" ? "secondary" : "ghost"} size="icon" className="w-10 h-10" onClick={() => { setTab("search"); setActiveTool("select") }} title="Search Icons">
                        <Search className="w-5 h-5" />
                    </Button>
                    <Button variant={activeTool === "draw" ? "secondary" : "ghost"} size="icon" className="w-10 h-10" onClick={() => { setActiveTool("draw"); setTab("draw") }} title="Draw">
                        <Pencil className="w-5 h-5" />
                    </Button>
                    <Button variant={activeTool === "eraser" ? "secondary" : "ghost"} size="icon" className="w-10 h-10" onClick={() => { setActiveTool("eraser"); setTab("draw") }} title="Eraser">
                        <Eraser className="w-5 h-5" />
                    </Button>
                    <Button variant={activeTool === "text" ? "secondary" : "ghost"} size="icon" className="w-10 h-10" onClick={() => { setActiveTool("text"); addText() }} title="Add Text">
                        <Type className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => { setActiveTool("select"); addShape("rect") }} title="Add Rectangle">
                        <Square className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => { setActiveTool("select"); addShape("circle") }} title="Add Circle">
                        <Circle className="w-5 h-5" />
                    </Button>

                    <div className="w-10 h-px bg-neutral-800 my-3" />

                    <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => setZoom(z => Math.max(10, z - 10))} title="Zoom Out">
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    <span className="text-[10px] text-neutral-400 my-1">{zoom}%</span>
                    <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom In">
                        <ZoomIn className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10" onClick={fitZoom} title="Fit">
                        <Maximize2 className="w-5 h-5" />
                    </Button>

                    <div className="w-10 h-px bg-neutral-800 my-3" />

                    <Button variant={showGrid ? "secondary" : "ghost"} size="icon" className="w-10 h-10" onClick={() => setShowGrid(!showGrid)} title="Grid">
                        <Grid3X3 className="w-5 h-5" />
                    </Button>

                    <div className="flex-1" />

                    {selected && (
                        <>
                            <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => onDuplicateIcon(selected.id)} title="Duplicate">
                                <Copy className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-10 h-10 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => { onDeleteIcon(selected.id); onSelectIcon(null) }} title="Delete">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </>
                    )}
                    {isMobile && (
                        <Button variant="ghost" size="icon" className={cn("w-10 h-10", showMobileProps && "bg-neutral-800 text-white")} onClick={() => setShowMobileProps(!showMobileProps)}>
                            <Settings2 className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* CANVAS AREA */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* TOP BAR */}
                    <div className={cn("h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0", isMobile ? "px-4" : "px-6")}>
                        <div className="flex items-center gap-4">
                            <h1 className="font-bold text-white text-lg">Canvas Editor</h1>
                            <span className="text-sm text-neutral-400 bg-neutral-800 px-3 py-1 rounded-full">{canvasW} × {canvasH}</span>
                            <span className="text-xs text-neutral-500 hidden md:inline">Slide {currentSlideIndex + 1}/{slides.length}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Collaboration Controls */}
                            <EditorCollabControls onOpenGroupModal={() => setShowGroupModal(true)} />
                            {collab?.isConnected && (
                                <Button variant={showChatPanel ? "secondary" : "ghost"} size="icon" onClick={() => setShowChatPanel(!showChatPanel)} title="Chat" className="relative">
                                    <MessageCircle className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-900" />
                                    )}
                                </Button>
                            )}

                            <div className="h-6 w-px bg-neutral-700 hidden md:block" />

                            <Button variant="outline" size="sm" className="bg-transparent border-neutral-700 text-white hover:bg-neutral-800 hidden md:flex" onClick={handleAddSlide}>
                                <PlusSquare className="w-4 h-4 mr-2" />Add Slide
                            </Button>
                            <Button variant="outline" className="bg-transparent border-neutral-700 text-white hover:bg-neutral-800" onClick={() => exportCanvas("png", 1)}>
                                <Download className="w-4 h-4 mr-2" />Export PNG
                            </Button>
                            <Button onClick={handleDoneClick}>
                                <Check className="w-4 h-4 mr-2" />Done
                            </Button>
                        </div>
                    </div>

                    {/* CANVAS VIEWPORT */}
                    <div
                        className="flex-1 overflow-auto flex items-center justify-center p-8 pb-24"
                        style={{ background: "#0a0a0f" }}
                    >
                        <div
                            ref={canvasRef}

                            className={cn(
                                "relative shadow-2xl",
                                activeTool === "select" ? "cursor-default" : "cursor-crosshair"
                            )}
                            style={{
                                width: canvasW,
                                height: canvasH,
                                transform: `scale(${zoom / 100})`,
                                transformOrigin: "center",
                                backgroundColor: bgColor,
                            }}
                            onClick={(ev) => {
                                if (ev.target === ev.currentTarget && activeTool === "select") {
                                    onSelectIcon(null);
                                    setSelectedTextId(null);
                                    setSelectedImageId(null)
                                }
                            }}
                            onMouseDown={(e) => {
                                if (activeTool === "draw" || activeTool === "eraser") startDraw(e)
                            }}
                            onMouseMove={(e) => {
                                handleMouseMove(e)
                                if (isResizing) handleResize(e)
                                else if (isDragging) handleDrag(e)
                                else if (isDrawing) draw(e)
                            }}
                            onMouseUp={() => {
                                if (isResizing) handleResizeEnd()
                                else if (isDragging) handleDragEnd()
                                else if (isDrawing) endDraw()
                            }}
                            onMouseLeave={() => {
                                if (isResizing) handleResizeEnd()
                                else if (isDragging) handleDragEnd()
                                else if (isDrawing) endDraw()
                            }}
                        >
                            {/* Grid */}
                            {showGrid && (
                                <div className="absolute inset-0 pointer-events-none" style={{
                                    backgroundImage: `linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px)`,
                                    backgroundSize: `${gridSize}px ${gridSize}px`
                                }} />
                            )}

                            {/* Drawing paths */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                {drawingPaths.map((path, i) => (
                                    <path
                                        key={i}
                                        d={path.points.length > 1 ? `M ${path.points[0].x} ${path.points[0].y} ${path.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")}` : ""}
                                        stroke={path.color}
                                        strokeWidth={path.size}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                ))}
                                {currentPath.length > 1 && (
                                    <path
                                        d={`M ${currentPath[0].x} ${currentPath[0].y} ${currentPath.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")}`}
                                        stroke={activeTool === "eraser" ? bgColor : drawColor}
                                        strokeWidth={activeTool === "eraser" ? drawSize * 3 : drawSize}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}
                            </svg>

                            {/* Unified Layer Rendering */}
                            {layerOrder.map(id => {
                                if (hidden.has(id)) return null
                                const itemData = getElementById(id)
                                if (!itemData) return null
                                const { type, element } = itemData
                                const isSelected = currentSelectedId === id

                                if (type === "icon") {
                                    const icon = element as CanvasIcon
                                    const ef = getEffects(icon.id)
                                    return (
                                        <div
                                            key={icon.id}
                                            onMouseDown={(e) => handleDragStart(e, "icon", icon.id, icon.x, icon.y)}
                                            className={cn(
                                                "absolute",
                                                activeTool === "select" && "cursor-move"
                                            )}
                                            style={{
                                                left: icon.x,
                                                top: icon.y,
                                                width: icon.size,
                                                height: icon.size,
                                                transform: `rotate(${icon.rotation}deg) scaleX(${ef.flipX ? -1 : 1}) scaleY(${ef.flipY ? -1 : 1})`,
                                                opacity: icon.opacity,
                                                outline: isSelected ? "2px dashed #3b82f6" : "none",
                                                outlineOffset: "3px",
                                                filter: [
                                                    ef.blur > 0 ? `blur(${ef.blur}px)` : "",
                                                    ef.brightness !== 100 ? `brightness(${ef.brightness}%)` : "",
                                                    ef.contrast !== 100 ? `contrast(${ef.contrast}%)` : "",
                                                    ef.saturate !== 100 ? `saturate(${ef.saturate}%)` : "",
                                                    ef.grayscale ? "grayscale(100%)" : ""
                                                ].filter(Boolean).join(" ") || undefined,
                                                boxShadow: ef.shadow > 0 ? `0 ${ef.shadow}px ${ef.shadow * 2}px rgba(0,0,0,.3)` : undefined,
                                                zIndex: layerOrder.indexOf(id)
                                            }}
                                        >
                                            {icon.icon.url ? (
                                                <img src={icon.icon.url} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                                            ) : icon.icon.body ? (
                                                <svg viewBox={`0 0 ${icon.icon.width || 24} ${icon.icon.height || 24}`} fill="currentColor" className="w-full h-full pointer-events-none" dangerouslySetInnerHTML={{ __html: icon.icon.body }} />
                                            ) : null}

                                            {isSelected && (
                                                <>
                                                    {["nw", "ne", "sw", "se"].map(dir => (
                                                        <div
                                                            key={dir}
                                                            onMouseDown={(e) => handleResizeStart(e, dir, "icon", icon.id)}
                                                            className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-50"
                                                            style={{
                                                                top: dir.includes("n") ? -5 : undefined,
                                                                bottom: dir.includes("s") ? -5 : undefined,
                                                                left: dir.includes("w") ? -5 : undefined,
                                                                right: dir.includes("e") ? -5 : undefined,
                                                                cursor: `${dir}-resize`
                                                            }}
                                                        />
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )
                                } else if (type === "image") {
                                    const img = element as ImageElement
                                    return (
                                        <div
                                            key={img.id}
                                            onMouseDown={(e) => handleDragStart(e, "image", img.id, img.x, img.y)}
                                            className={cn(
                                                "absolute",
                                                activeTool === "select" && "cursor-move"
                                            )}
                                            style={{
                                                left: img.x,
                                                top: img.y,
                                                width: img.width,
                                                height: img.height,
                                                transform: `rotate(${img.rotation}deg)`,
                                                opacity: img.opacity,
                                                outline: isSelected ? "2px dashed #22c55e" : "none",
                                                outlineOffset: "3px",
                                                zIndex: layerOrder.indexOf(id)
                                            }}
                                        >
                                            <img src={img.src} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                                            {isSelected && (
                                                <>
                                                    {["nw", "ne", "sw", "se"].map(dir => (
                                                        <div
                                                            key={dir}
                                                            onMouseDown={(e) => handleResizeStart(e, dir, "image", img.id)}
                                                            className="absolute w-3 h-3 bg-white border border-green-500 rounded-full z-50"
                                                            style={{
                                                                top: dir.includes("n") ? -5 : undefined,
                                                                bottom: dir.includes("s") ? -5 : undefined,
                                                                left: dir.includes("w") ? -5 : undefined,
                                                                right: dir.includes("e") ? -5 : undefined,
                                                                cursor: `${dir}-resize`
                                                            }}
                                                        />
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )
                                } else if (type === "shape") {
                                    const shape = element as ShapeElement
                                    return (
                                        <div
                                            key={shape.id}
                                            onMouseDown={(e) => handleDragStart(e, "shape", shape.id, shape.x, shape.y)}
                                            className={cn(
                                                "absolute",
                                                activeTool === "select" && "cursor-move"
                                            )}
                                            style={{
                                                left: shape.x,
                                                top: shape.y,
                                                width: shape.width,
                                                height: shape.height,
                                                transform: `rotate(${shape.rotation}deg)`,
                                                opacity: shape.opacity,
                                                outline: isSelected ? "2px dashed #3b82f6" : "none",
                                                outlineOffset: "3px",
                                                borderRadius: shape.type === "circle" ? "50%" : `${shape.cornerRadius || 0}px`,
                                                backgroundColor: shape.fill,
                                                border: shape.strokeWidth > 0 ? `${shape.strokeWidth}px solid ${shape.stroke}` : undefined,
                                                zIndex: layerOrder.indexOf(id)
                                            }}
                                        >
                                            {isSelected && (
                                                <>
                                                    {["nw", "ne", "sw", "se"].map(dir => (
                                                        <div
                                                            key={dir}
                                                            onMouseDown={(e) => handleResizeStart(e, dir, "shape", shape.id)}
                                                            className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-50"
                                                            style={{
                                                                top: dir.includes("n") ? -5 : undefined,
                                                                bottom: dir.includes("s") ? -5 : undefined,
                                                                left: dir.includes("w") ? -5 : undefined,
                                                                right: dir.includes("e") ? -5 : undefined,
                                                                cursor: `${dir}-resize`
                                                            }}
                                                        />
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )
                                } else if (type === "text") {
                                    const t = element as TextElement
                                    return (
                                        <div
                                            key={t.id}
                                            onMouseDown={(e) => handleDragStart(e, "text", t.id, t.x, t.y)}
                                            className={cn(
                                                "absolute",
                                                activeTool === "select" && "cursor-move",
                                                t.effect && `font-effect-${t.effect}`
                                            )}
                                            style={{
                                                left: t.x,
                                                top: t.y,
                                                transform: `rotate(${t.rotation}deg)`,
                                                transformOrigin: "top left",
                                                outline: isSelected ? "2px solid #a855f7" : "none",
                                                outlineOffset: "4px",
                                                zIndex: layerOrder.indexOf(id)
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: t.fontSize,
                                                    fontFamily: t.fontFamily,
                                                    fontWeight: t.fontWeight,
                                                    fontStyle: t.fontStyle,
                                                    textDecoration: t.textDecoration,
                                                    color: t.color,
                                                    opacity: t.opacity,
                                                    letterSpacing: t.letterSpacing ? `${t.letterSpacing}px` : undefined,
                                                    lineHeight: t.lineHeight ? t.lineHeight : undefined,
                                                    WebkitTextStroke: t.strokeWidth ? `${t.strokeWidth}px ${t.strokeColor || "#000"}` : undefined,
                                                    userSelect: "none",
                                                    WebkitUserSelect: "none",
                                                    whiteSpace: "pre-wrap",
                                                    display: "block",
                                                }}
                                            >
                                                {t.text}
                                            </span>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    </div>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                {/* RIGHT PANEL */}
                <div className={cn("bg-neutral-900 flex flex-col shrink-0 transition-transform duration-300", isMobile ? (showMobileProps ? "fixed inset-x-0 bottom-0 top-[30%] z-[10000] rounded-t-xl border-t border-neutral-800 shadow-2xl" : "hidden") : cn("border-l border-neutral-800", tab === "search" ? "w-80 xl:w-96 overflow-hidden" : "w-80"))}>
                    {isMobile && (
                        <div className="flex items-center justify-between p-3 border-b border-neutral-800">
                            <span className="font-bold text-white">Properties</span>
                            <Button variant="ghost" size="icon" onClick={() => setShowMobileProps(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                    {/* TABS */}
                    <div className="flex border-b border-neutral-800 shrink-0 overflow-x-auto">
                        {(["canvas", "object", "effects", "text", "images", "draw", "layers"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={cn(
                                    "flex-1 py-3 text-[10px] font-medium capitalize transition-colors whitespace-nowrap px-1",
                                    tab === t ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
                        {tab === "search" ? (
                            <IconSearchPanel
                                onSelectIcon={handleAddIconFromSearch}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                aiSearchQuery={aiSearchQuery}
                                setAiSearchQuery={setAiSearchQuery}
                                isMobile={isMobile}
                                onClose={() => setTab("object")}
                            />
                        ) : (
                            <div className="p-4 space-y-6">

                                {/* CANVAS TAB */}
                                {tab === "canvas" && (
                                    <>
                                        <Section title="Canvas Size">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-[10px] text-neutral-500 mb-1.5 block">Width</Label>
                                                    <Input type="number" value={canvasW} onChange={ev => setCanvasW(Math.max(50, +ev.target.value))} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-neutral-500 mb-1.5 block">Height</Label>
                                                    <Input type="number" value={canvasH} onChange={ev => setCanvasH(Math.max(50, +ev.target.value))} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                </div>
                                            </div>
                                        </Section>

                                        <Section title="Presets">
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {CANVAS_PRESETS.map(p => (
                                                    <Button key={p.name} variant="outline" size="sm" className="h-9 text-[10px] bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white" onClick={() => { setCanvasW(p.w); setCanvasH(p.h) }}>
                                                        {p.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </Section>

                                        <Section title="Background Color">
                                            <div className="grid grid-cols-6 gap-2">
                                                {BG_COLORS.map(c => (
                                                    <button key={c} onClick={() => setBgColor(c)} className={cn("aspect-square rounded-lg border-2 transition-all", bgColor === c ? "border-blue-500 scale-110" : "border-transparent hover:border-neutral-600")} style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <input type="color" value={bgColor} onChange={ev => setBgColor(ev.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                                                <Input value={bgColor} onChange={ev => setBgColor(ev.target.value)} className="flex-1 h-10 bg-neutral-800 border-neutral-700 text-white font-mono" />
                                            </div>
                                        </Section>

                                        <Section title="Grid">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-neutral-300">Show Grid</span>
                                                    <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                                                </div>
                                                {showGrid && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-neutral-300">Grid Size</span>
                                                        <Input type="number" value={gridSize} onChange={ev => setGridSize(+ev.target.value)} className="w-20 h-9 bg-neutral-800 border-neutral-700 text-white text-center" />
                                                    </div>
                                                )}
                                            </div>
                                        </Section>

                                        <Section title="Export">
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button variant="outline" className="h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => exportCanvas("png", 1)}>PNG</Button>
                                                <Button variant="outline" className="h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => exportCanvas("jpg", 1)}>JPG</Button>
                                                <Button variant="outline" className="h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => exportCanvas("webp", 1)}>WebP</Button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                {[0.5, 1, 2, 4].map(s => (
                                                    <Button key={s} variant="outline" size="sm" className="h-9 bg-transparent border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white" onClick={() => exportCanvas("png", s)}>
                                                        {s}x
                                                    </Button>
                                                ))}
                                            </div>
                                        </Section>
                                    </>
                                )}

                                {/* OBJECT TAB */}
                                {tab === "object" && (
                                    <>
                                        {selectedShape ? (
                                            <>
                                                <Section title="Shape Appearance">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Fill Color</Label>
                                                            <div className="flex gap-2">
                                                                <input type="color" value={selectedShape.fill} onChange={ev => updateShape(selectedShape.id, { fill: ev.target.value })} className="w-10 h-10 rounded border-0 cursor-pointer p-0" />
                                                                <Input value={selectedShape.fill} onChange={ev => updateShape(selectedShape.id, { fill: ev.target.value })} className="flex-1 h-10 bg-neutral-800 border-neutral-700 text-white font-mono" />
                                                            </div>
                                                        </div>
                                                        <SliderControl label="Opacity" value={Math.round(selectedShape.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={v => updateShape(selectedShape.id, { opacity: v / 100 })} />

                                                        {selectedShape.type === "rect" && (
                                                            <SliderControl label="Corner Radius" value={selectedShape.cornerRadius || 0} min={0} max={100} step={1} unit="px" onChange={v => updateShape(selectedShape.id, { cornerRadius: v })} />
                                                        )}

                                                        <SliderControl label="Stroke Width" value={selectedShape.strokeWidth} min={0} max={20} step={1} unit="px" onChange={v => updateShape(selectedShape.id, { strokeWidth: v })} />
                                                        {selectedShape.strokeWidth > 0 && (
                                                            <div>
                                                                <Label className="text-[10px] text-neutral-500 mb-1.5 block">Stroke Color</Label>
                                                                <div className="flex gap-2">
                                                                    <input type="color" value={selectedShape.stroke} onChange={ev => updateShape(selectedShape.id, { stroke: ev.target.value })} className="w-10 h-10 rounded border-0 cursor-pointer p-0" />
                                                                    <Input value={selectedShape.stroke} onChange={ev => updateShape(selectedShape.id, { stroke: ev.target.value })} className="flex-1 h-10 bg-neutral-800 border-neutral-700 text-white font-mono" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Section>

                                                <Section title="Position">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">X</Label>
                                                            <Input type="number" value={Math.round(selectedShape.x)} onChange={ev => updateShape(selectedShape.id, { x: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Y</Label>
                                                            <Input type="number" value={Math.round(selectedShape.y)} onChange={ev => updateShape(selectedShape.id, { y: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                    </div>
                                                </Section>

                                                <Section title="Dimensions">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Width</Label>
                                                            <Input type="number" value={Math.round(selectedShape.width)} onChange={ev => updateShape(selectedShape.id, { width: Math.max(10, +ev.target.value) })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Height</Label>
                                                            <Input type="number" value={Math.round(selectedShape.height)} onChange={ev => updateShape(selectedShape.id, { height: Math.max(10, +ev.target.value) })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                    </div>
                                                </Section>

                                                <Section title="Rotation">
                                                    <SliderControl label="Angle" value={selectedShape.rotation} min={0} max={360} step={1} unit="°" onChange={v => updateShape(selectedShape.id, { rotation: v })} />
                                                </Section>

                                                <Section title="Actions">
                                                    <Button variant="outline" className="w-full h-10 bg-transparent border-neutral-700 text-red-400 hover:bg-neutral-800 hover:text-red-300" onClick={() => deleteShape(selectedShape.id)}>
                                                        <Trash2 className="w-4 h-4 mr-2" />Delete Shape
                                                    </Button>
                                                </Section>
                                            </>
                                        ) : !selected ? (
                                            <div className="text-center py-16 text-neutral-500">Select an object to edit</div>
                                        ) : (
                                            <>
                                                <Section title="Position">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">X</Label>
                                                            <Input type="number" value={Math.round(selected.x)} onChange={ev => onUpdateIcon(selected.id, { x: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Y</Label>
                                                            <Input type="number" value={Math.round(selected.y)} onChange={ev => onUpdateIcon(selected.id, { y: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                    </div>
                                                </Section>

                                                <Section title="Size">
                                                    <SliderControl label="Size" value={selected.size} min={16} max={500} step={4} unit="px" onChange={v => onUpdateIcon(selected.id, { size: v })} />
                                                </Section>

                                                <Section title="Rotation">
                                                    <SliderControl label="Angle" value={selected.rotation} min={0} max={360} step={1} unit="°" onChange={v => onUpdateIcon(selected.id, { rotation: v })} />
                                                    <div className="flex gap-2 mt-3">
                                                        <Button variant="outline" className="flex-1 h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => onUpdateIcon(selected.id, { rotation: (selected.rotation - 90 + 360) % 360 })}>
                                                            <RotateCcw className="w-4 h-4 mr-2" />-90°
                                                        </Button>
                                                        <Button variant="outline" className="flex-1 h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => onUpdateIcon(selected.id, { rotation: (selected.rotation + 90) % 360 })}>
                                                            <RotateCw className="w-4 h-4 mr-2" />+90°
                                                        </Button>
                                                    </div>
                                                </Section>

                                                <Section title="Opacity">
                                                    <SliderControl label="Opacity" value={Math.round(selected.opacity * 100)} min={10} max={100} step={5} unit="%" onChange={v => onUpdateIcon(selected.id, { opacity: v / 100 })} />
                                                </Section>

                                                <Section title="Flip">
                                                    <div className="flex gap-2">
                                                        <Button variant={e?.flipX ? "secondary" : "outline"} className="flex-1 h-10 bg-transparent border-neutral-700" onClick={() => setEffect(selected.id, "flipX", !e?.flipX)}>
                                                            <FlipHorizontal className="w-4 h-4 mr-2" />Horizontal
                                                        </Button>
                                                        <Button variant={e?.flipY ? "secondary" : "outline"} className="flex-1 h-10 bg-transparent border-neutral-700" onClick={() => setEffect(selected.id, "flipY", !e?.flipY)}>
                                                            <FlipVertical className="w-4 h-4 mr-2" />Vertical
                                                        </Button>
                                                    </div>
                                                </Section>

                                                <Section title="Align to Canvas">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Button variant="outline" size="icon" className="h-10 w-full bg-transparent border-neutral-700 hover:bg-neutral-700" onClick={() => align("left")}><AlignLeft className="w-5 h-5" /></Button>
                                                        <Button variant="outline" size="icon" className="h-10 w-full bg-transparent border-neutral-700 hover:bg-neutral-700" onClick={() => align("centerH")}><AlignCenter className="w-5 h-5" /></Button>
                                                        <Button variant="outline" size="icon" className="h-10 w-full bg-transparent border-neutral-700 hover:bg-neutral-700" onClick={() => align("right")}><AlignRight className="w-5 h-5" /></Button>
                                                        <Button variant="outline" size="icon" className="h-10 w-full bg-transparent border-neutral-700 hover:bg-neutral-700" onClick={() => align("top")}><AlignStartVertical className="w-5 h-5" /></Button>
                                                        <Button variant="outline" size="icon" className="h-10 w-full bg-transparent border-neutral-700 hover:bg-neutral-700" onClick={() => align("centerV")}><AlignCenterVertical className="w-5 h-5" /></Button>
                                                        <Button variant="outline" size="icon" className="h-10 w-full bg-transparent border-neutral-700 hover:bg-neutral-700" onClick={() => align("bottom")}><AlignEndVertical className="w-5 h-5" /></Button>
                                                    </div>
                                                </Section>

                                                <Section title="Actions">
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" className="flex-1 h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => onDuplicateIcon(selected.id)}>
                                                            <Copy className="w-4 h-4 mr-2" />Duplicate
                                                        </Button>
                                                        <Button variant="destructive" className="flex-1 h-10" onClick={() => { onDeleteIcon(selected.id); onSelectIcon(null) }}>
                                                            <Trash2 className="w-4 h-4 mr-2" />Delete
                                                        </Button>
                                                    </div>
                                                </Section>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* EFFECTS TAB */}
                                {tab === "effects" && (
                                    <>
                                        {!selected ? (
                                            <div className="text-center py-16 text-neutral-500">Select an object to edit</div>
                                        ) : (
                                            <>
                                                <Section title="Shadow">
                                                    <SliderControl label="Shadow" value={e?.shadow || 0} min={0} max={50} step={1} unit="px" icon={<Droplets className="w-4 h-4" />} onChange={v => setEffect(selected.id, "shadow", v)} />
                                                </Section>

                                                <Section title="Blur">
                                                    <SliderControl label="Blur" value={e?.blur || 0} min={0} max={30} step={1} unit="px" onChange={v => setEffect(selected.id, "blur", v)} />
                                                </Section>

                                                <Section title="Brightness">
                                                    <SliderControl label="Brightness" value={e?.brightness || 100} min={0} max={200} step={5} unit="%" icon={<Sun className="w-4 h-4" />} onChange={v => setEffect(selected.id, "brightness", v)} />
                                                </Section>

                                                <Section title="Contrast">
                                                    <SliderControl label="Contrast" value={e?.contrast || 100} min={0} max={200} step={5} unit="%" icon={<Contrast className="w-4 h-4" />} onChange={v => setEffect(selected.id, "contrast", v)} />
                                                </Section>

                                                <Section title="Saturation">
                                                    <SliderControl label="Saturation" value={e?.saturate || 100} min={0} max={200} step={5} unit="%" icon={<Sparkles className="w-4 h-4" />} onChange={v => setEffect(selected.id, "saturate", v)} />
                                                </Section>

                                                <Section title="Filters">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-neutral-300">Grayscale</span>
                                                        <Switch checked={e?.grayscale || false} onCheckedChange={v => setEffect(selected.id, "grayscale", v)} />
                                                    </div>
                                                </Section>

                                                <Button variant="outline" className="w-full h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => setEffects(p => { const n = { ...p }; delete n[selected.id]; return n })}>
                                                    <RefreshCw className="w-4 h-4 mr-2" />Reset All Effects
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* TEXT TAB */}
                                {tab === "text" && (
                                    <>
                                        <Button className="w-full h-10 mb-4" onClick={addText}>
                                            <Type className="w-4 h-4 mr-2" />Add Text
                                        </Button>

                                        {!selectedText ? (
                                            <div className="text-center py-12 text-neutral-500">Select a text element or add new</div>
                                        ) : (
                                            <>
                                                <Section title="Text Content">
                                                    <Textarea
                                                        value={selectedText.text}
                                                        onChange={ev => updateText(selectedText.id, { text: ev.target.value })}
                                                        className="min-h-[80px] bg-neutral-800 border-neutral-700 text-white resize-none"
                                                        placeholder="Enter text..."
                                                    />
                                                </Section>

                                                <Section title="Font">
                                                    <select
                                                        value={selectedText.fontFamily}
                                                        onChange={ev => updateText(selectedText.id, { fontFamily: ev.target.value })}
                                                        className="w-full h-10 bg-neutral-800 border border-neutral-700 rounded-md text-white px-3"
                                                    >
                                                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                    </select>
                                                </Section>

                                                <Section title="Style">
                                                    <div className="flex gap-2">
                                                        <Button variant={selectedText.fontWeight === "bold" ? "secondary" : "outline"} size="icon" className="h-10 w-12 bg-transparent border-neutral-700" onClick={() => updateText(selectedText.id, { fontWeight: selectedText.fontWeight === "bold" ? "normal" : "bold" })}>
                                                            <Bold className="w-5 h-5" />
                                                        </Button>
                                                        <Button variant={selectedText.fontStyle === "italic" ? "secondary" : "outline"} size="icon" className="h-10 w-12 bg-transparent border-neutral-700" onClick={() => updateText(selectedText.id, { fontStyle: selectedText.fontStyle === "italic" ? "normal" : "italic" })}>
                                                            <Italic className="w-5 h-5" />
                                                        </Button>
                                                        <Button variant={selectedText.textDecoration === "underline" ? "secondary" : "outline"} size="icon" className="h-10 w-12 bg-transparent border-neutral-700" onClick={() => updateText(selectedText.id, { textDecoration: selectedText.textDecoration === "underline" ? "none" : "underline" })}>
                                                            <Underline className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </Section>

                                                <Section title="Size">
                                                    <SliderControl label="Font Size" value={selectedText.fontSize} min={8} max={200} step={2} unit="px" onChange={v => updateText(selectedText.id, { fontSize: v })} />
                                                </Section>

                                                <Section title="Color">
                                                    <div className="flex items-center gap-3">
                                                        <input type="color" value={selectedText.color} onChange={ev => updateText(selectedText.id, { color: ev.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                                                        <Input value={selectedText.color} onChange={ev => updateText(selectedText.id, { color: ev.target.value })} className="flex-1 h-10 bg-neutral-800 border-neutral-700 text-white font-mono" />
                                                    </div>
                                                </Section>

                                                <Section title="Position">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">X</Label>
                                                            <Input type="number" value={Math.round(selectedText.x)} onChange={ev => updateText(selectedText.id, { x: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Y</Label>
                                                            <Input type="number" value={Math.round(selectedText.y)} onChange={ev => updateText(selectedText.id, { y: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                    </div>
                                                </Section>

                                                <Section title="Rotation">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Input
                                                            type="number"
                                                            value={selectedText.rotation}
                                                            onChange={ev => updateText(selectedText.id, { rotation: (+ev.target.value % 360 + 360) % 360 })}
                                                            className="h-10 bg-neutral-800 border-neutral-700 text-white text-center"
                                                            min={0}
                                                            max={359}
                                                        />
                                                        <span className="text-sm text-neutral-400">°</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" className="flex-1 h-9 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => updateText(selectedText.id, { rotation: (selectedText.rotation - 15 + 360) % 360 })}>
                                                            <RotateCcw className="w-4 h-4 mr-1" />-15°
                                                        </Button>
                                                        <Button variant="outline" className="flex-1 h-9 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => updateText(selectedText.id, { rotation: (selectedText.rotation + 15) % 360 })}>
                                                            <RotateCw className="w-4 h-4 mr-1" />+15°
                                                        </Button>
                                                        <Button variant="outline" className="flex-1 h-9 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => updateText(selectedText.id, { rotation: 0 })}>
                                                            Reset
                                                        </Button>
                                                    </div>
                                                </Section>

                                                <Section title="Opacity">
                                                    <SliderControl label="Opacity" value={Math.round(selectedText.opacity * 100)} min={10} max={100} step={5} unit="%" onChange={v => updateText(selectedText.id, { opacity: v / 100 })} />
                                                </Section>

                                                <Section title="Letter Spacing">
                                                    <SliderControl label="Spacing" value={selectedText.letterSpacing || 0} min={-10} max={50} step={1} unit="px" onChange={v => updateText(selectedText.id, { letterSpacing: v })} />
                                                </Section>

                                                <Section title="Line Height">
                                                    <SliderControl label="Line Height" value={selectedText.lineHeight || 1.2} min={0.5} max={3} step={0.1} unit="x" onChange={v => updateText(selectedText.id, { lineHeight: v })} />
                                                </Section>

                                                <Section title="Text Stroke">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <input type="color" value={selectedText.strokeColor || "#000000"} onChange={ev => updateText(selectedText.id, { strokeColor: ev.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                                                        <SliderControl label="Width" value={selectedText.strokeWidth || 0} min={0} max={10} step={1} unit="px" onChange={v => updateText(selectedText.id, { strokeWidth: v })} />
                                                    </div>
                                                </Section>



                                                <Button variant="destructive" className="w-full h-10" onClick={() => deleteText(selectedText.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" />Delete Text
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* IMAGES TAB */}
                                {tab === "images" && (
                                    <>
                                        <Button className="w-full h-10 mb-4" onClick={() => fileInputRef.current?.click()}>
                                            <ImagePlus className="w-4 h-4 mr-2" />Upload Image
                                        </Button>

                                        {!selectedImage ? (
                                            <div className="text-center py-12 text-neutral-500">
                                                {imageElements.length === 0 ? "Upload an image to get started" : "Select an image to edit"}
                                            </div>
                                        ) : (
                                            <>
                                                <Section title="Preview">
                                                    <div className="w-full aspect-square bg-neutral-800 rounded-lg flex items-center justify-center overflow-hidden">
                                                        <img src={selectedImage.src} alt="" className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                </Section>

                                                <Section title="Size">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Width</Label>
                                                            <Input type="number" value={Math.round(selectedImage.width)} onChange={ev => updateImage(selectedImage.id, { width: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Height</Label>
                                                            <Input type="number" value={Math.round(selectedImage.height)} onChange={ev => updateImage(selectedImage.id, { height: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                    </div>
                                                </Section>

                                                <Section title="Position">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">X</Label>
                                                            <Input type="number" value={Math.round(selectedImage.x)} onChange={ev => updateImage(selectedImage.id, { x: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-neutral-500 mb-1.5 block">Y</Label>
                                                            <Input type="number" value={Math.round(selectedImage.y)} onChange={ev => updateImage(selectedImage.id, { y: +ev.target.value })} className="h-10 bg-neutral-800 border-neutral-700 text-white" />
                                                        </div>
                                                    </div>
                                                </Section>

                                                <Section title="Rotation">
                                                    <SliderControl label="Angle" value={selectedImage.rotation} min={0} max={360} step={5} unit="°" onChange={v => updateImage(selectedImage.id, { rotation: v })} />
                                                </Section>

                                                <Section title="Opacity">
                                                    <SliderControl label="Opacity" value={Math.round(selectedImage.opacity * 100)} min={10} max={100} step={5} unit="%" onChange={v => updateImage(selectedImage.id, { opacity: v / 100 })} />
                                                </Section>

                                                <Button variant="destructive" className="w-full h-10" onClick={() => deleteImage(selectedImage.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" />Delete Image
                                                </Button>
                                            </>
                                        )}

                                        {imageElements.length > 0 && (
                                            <Section title={`All Images (${imageElements.length})`}>
                                                <div className="space-y-2">
                                                    {imageElements.map(img => (
                                                        <div
                                                            key={img.id}
                                                            onClick={() => setSelectedImageId(img.id)}
                                                            className={cn(
                                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
                                                                selectedImageId === img.id ? "bg-green-600/20 border border-green-500/50" : "bg-neutral-800 hover:bg-neutral-750"
                                                            )}
                                                        >
                                                            <div className="w-12 h-12 rounded bg-neutral-900 flex items-center justify-center overflow-hidden">
                                                                <img src={img.src} alt="" className="max-w-full max-h-full object-contain" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-white truncate">Image</p>
                                                                <p className="text-[10px] text-neutral-500">{img.width}×{img.height}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Section>
                                        )}
                                    </>
                                )}

                                {/* DRAW TAB */}
                                {tab === "draw" && (
                                    <>
                                        <Section title="Brush Color">
                                            <div className="grid grid-cols-5 gap-2">
                                                {DRAW_COLORS.map(c => (
                                                    <button key={c} onClick={() => setDrawColor(c)} className={cn("aspect-square rounded-lg border-2 transition-all", drawColor === c ? "border-blue-500 scale-110" : "border-transparent hover:border-neutral-600")} style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <input type="color" value={drawColor} onChange={ev => setDrawColor(ev.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                                                <Input value={drawColor} onChange={ev => setDrawColor(ev.target.value)} className="flex-1 h-10 bg-neutral-800 border-neutral-700 text-white font-mono" />
                                            </div>
                                        </Section>

                                        <Section title="Brush Size">
                                            <SliderControl label="Size" value={drawSize} min={1} max={50} step={1} unit="px" onChange={setDrawSize} />
                                            <div className="flex items-center justify-center mt-3">
                                                <div className="rounded-full bg-neutral-400" style={{ width: drawSize, height: drawSize }} />
                                            </div>
                                        </Section>

                                        <Section title="Tools">
                                            <div className="flex gap-2">
                                                <Button variant={activeTool === "draw" ? "secondary" : "outline"} className="flex-1 h-10 bg-transparent border-neutral-700" onClick={() => setActiveTool("draw")}>
                                                    <Pencil className="w-4 h-4 mr-2" />Pen
                                                </Button>
                                                <Button variant={activeTool === "eraser" ? "secondary" : "outline"} className="flex-1 h-10 bg-transparent border-neutral-700" onClick={() => setActiveTool("eraser")}>
                                                    <Eraser className="w-4 h-4 mr-2" />Eraser
                                                </Button>
                                            </div>
                                        </Section>

                                        <Section title="Actions">
                                            <Button variant="outline" className="w-full h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={clearDrawings}>
                                                <Trash2 className="w-4 h-4 mr-2" />Clear All Drawings
                                            </Button>
                                        </Section>

                                        <div className="text-xs text-neutral-500 mt-4">
                                            <p><strong>Tip:</strong> Click and drag on canvas to draw</p>
                                            <p className="mt-1">Strokes: {drawingPaths.length}</p>
                                        </div>
                                    </>
                                )}

                                {/* LAYERS TAB */}
                                {tab === "layers" && (
                                    <>
                                        <Section title={`All Layers (${layerOrder.length})`}>
                                            {layerOrder.length === 0 ? (
                                                <div className="text-center py-12 text-neutral-500">No objects</div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {[...layerOrder].reverse().map(id => {
                                                        const item = getElementById(id)
                                                        if (!item) return null
                                                        const { type, element } = item

                                                        let name = "Unknown"
                                                        let thumbnail: string | undefined

                                                        if (type === "icon") {
                                                            const ic = element as CanvasIcon; name = ic.icon.name; thumbnail = ic.icon.url
                                                        } else if (type === "text") {
                                                            name = (element as TextElement).text.slice(0, 20) || "Text"
                                                        } else if (type === "image") {
                                                            name = "Image"; thumbnail = (element as ImageElement).src
                                                        }

                                                        const isSelected = currentSelectedId === id

                                                        return (
                                                            <LayerItem
                                                                key={id}
                                                                name={name}
                                                                type={type.charAt(0).toUpperCase() + type.slice(1)}
                                                                thumbnail={thumbnail}
                                                                selected={isSelected}
                                                                hidden={hidden.has(id)}
                                                                locked={locked.has(id)}
                                                                onClick={() => {
                                                                    onSelectIcon(type === "icon" ? id : null)
                                                                    setSelectedTextId(type === "text" ? id : null)
                                                                    setSelectedImageId(type === "image" ? id : null)
                                                                    if (type === "icon") setTab("object")
                                                                    else if (type === "text") setTab("text")
                                                                    else if (type === "image") setTab("images")
                                                                }}
                                                                onToggleHide={() => setHidden(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })}
                                                                onToggleLock={() => setLocked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })}
                                                                draggable={true}
                                                                onDragStart={() => setDraggedLayerId(id)}
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDrop={(e) => handleLayerDrop(e, id)}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </Section>

                                        {currentSelectedId && (
                                            <Section title="Layer Order">
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1 h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => moveLayer("front")}>
                                                        <ChevronUp className="w-4 h-4 mr-2" />Front
                                                    </Button>
                                                    <Button variant="outline" className="flex-1 h-10 bg-transparent border-neutral-700 text-white hover:bg-neutral-700" onClick={() => moveLayer("back")}>
                                                        <ChevronDown className="w-4 h-4 mr-2" />Back
                                                    </Button>
                                                </div>
                                            </Section>
                                        )}
                                    </>
                                )}

                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Exit Confirmation Dialog */}
            <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            </div>
                            <DialogTitle className="text-xl">Save Your Work?</DialogTitle>
                        </div>
                        <DialogDescription className="text-neutral-400 text-sm">
                            Your canvas edits (text, images, and drawings) will be cleared when you exit.
                            Download your canvas now to keep your design.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3 font-semibold">Download Canvas As</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => exportAllFormats("png")}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-blue-500 transition-all group"
                            >
                                <FileImage className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">PNG</span>
                                <span className="text-[10px] text-neutral-500">Lossless</span>
                            </button>
                            <button
                                onClick={() => exportAllFormats("jpg")}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-green-500 transition-all group"
                            >
                                <FileImage className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">JPG</span>
                                <span className="text-[10px] text-neutral-500">Smaller File</span>
                            </button>
                            <button
                                onClick={() => exportAllFormats("webp")}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-purple-500 transition-all group"
                            >
                                <FileType className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">WebP</span>
                                <span className="text-[10px] text-neutral-500">Best Quality</span>
                            </button>
                            <button
                                onClick={() => exportAllFormats("zip")}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-yellow-500 transition-all group"
                            >
                                <Download className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">ZIP</span>
                                <span className="text-[10px] text-neutral-500">All Slides</span>
                            </button>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="ghost"
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                            onClick={() => setShowExitDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-transparent border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                            onClick={handleDone}
                        >
                            Continue Anyway
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Slide Panel - Bottom bar for multi-canvas navigation */}
            {!isMobile && (
                <SlidePanel
                    slides={slides}
                    currentSlideIndex={currentSlideIndex}
                    onSelectSlide={handleSelectSlide}
                    onAddSlide={handleAddSlide}
                    onDuplicateSlide={handleDuplicateSlide}
                    onDeleteSlide={handleDeleteSlide}
                    onRenameSlide={handleRenameSlide}
                    rightPanelWidth={tab === "search" ? 384 : 320}
                />
            )}

            {/* Editor Chat Panel */}
            <EditorChatPanel
                isOpen={showChatPanel}
                onToggle={() => setShowChatPanel(!showChatPanel)}
            />

            {/* Member Cursors Overlay */}
            <MemberCursors containerRef={canvasRef} />

            {/* Group Modal */}
            <GroupModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
            />
        </div>
    )
}

// Section wrapper
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">{title}</h3>
            {children}
        </div>
    )
}

// Slider control with proper styling
function SliderControl({ label, value, min, max, step, unit, icon, onChange }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    unit: string
    icon?: React.ReactNode
    onChange: (v: number) => void
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-300 flex items-center gap-2">{icon}{label}</span>
                <span className="text-sm text-neutral-500 font-mono">{value}{unit}</span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={ev => onChange(+ev.target.value)}
                    className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
            </div>
        </div>
    )
}

// Layer item
interface LayerItemProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string
    type: string
    thumbnail?: string
    selected: boolean
    hidden: boolean
    locked: boolean
    onClick: () => void
    onToggleHide: () => void
    onToggleLock: () => void
}

function LayerItem({ name, type, thumbnail, selected, hidden, locked, onClick, onToggleHide, onToggleLock, className, ...props }: LayerItemProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                selected ? "bg-blue-600/20 border border-blue-500/50" : "bg-neutral-800 hover:bg-neutral-750",
                className
            )}
            {...props}
        >
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden">
                {thumbnail ? (
                    <img src={thumbnail} alt="" className="w-8 h-8 object-contain" />
                ) : (
                    <Type className="w-5 h-5 text-neutral-500" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{name}</p>
                <p className="text-[10px] text-neutral-500">{type}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-neutral-400 hover:text-white" onClick={ev => { ev.stopPropagation(); onToggleHide() }}>
                    {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-neutral-400 hover:text-white" onClick={ev => { ev.stopPropagation(); onToggleLock() }}>
                    {locked ? <Lock className="w-4 h-4 text-yellow-500" /> : <Unlock className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    )
}

function Header({ title, onBack, rightContent }: { title: string, onBack: () => void, rightContent?: React.ReactNode }) {
    return (
        <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 text-neutral-400 hover:text-white">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-white">{title}</h1>
                    <span className="text-[10px] text-neutral-500">Autosaved</span>
                </div>
            </div>
            {rightContent}
        </div>
    )
}
