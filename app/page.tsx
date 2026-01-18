"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { IconSearchPanel } from "@/components/icon-search-panel"
import { DrawingCanvas, DrawingCanvasRef } from "@/components/drawing-canvas"
import { IconCustomizer } from "@/components/icon-customizer"
import { CanvasEditor } from "@/components/canvas-editor"
import { Header } from "@/components/header"
import { WelcomeOverlay } from "@/components/welcome-overlay"
import { MobileToolbar } from "@/components/mobile-toolbar"
import { GroupChat } from "@/components/group-chat"
import { CollaborationProvider } from "@/lib/collaboration-context"
import type { CanvasIcon, IconData, Tool, BrushSettings } from "@/types/icon"
import { Toaster, toast } from "sonner"
import { AnimatePresence } from "framer-motion"

export default function Home() {
  const [savedCanvasImage, setSavedCanvasImage] = useState<string | null>(null)
  const [canvasIcons, setCanvasIcons] = useState<CanvasIcon[]>([])
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [aiSearchQuery, setAiSearchQuery] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>("pen")
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 4,
    color: "#1a1a2e",
    opacity: 1,
  })
  const [mobileView, setMobileView] = useState<"canvas" | "search">("canvas")
  const [isMobile, setIsMobile] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)

  // Refs to DrawingCanvas for external clear (desktop & mobile)
  const desktopCanvasRef = useRef<DrawingCanvasRef>(null)
  const mobileCanvasRef = useRef<DrawingCanvasRef>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const selectedIcon = canvasIcons.find((icon) => icon.id === selectedIconId)

  const handleAddIconToCanvas = useCallback(
    (icon: IconData, position?: { x: number; y: number }) => {
      const newCanvasIcon: CanvasIcon = {
        id: `${icon.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        icon,
        x: position?.x ?? Math.random() * 300 + 50,
        y: position?.y ?? Math.random() * 200 + 50,
        size: 56,
        color: "#6366f1",
        rotation: 0,
        opacity: 1,
      }
      setCanvasIcons((prev) => [...prev, newCanvasIcon])
      setSelectedIconId(newCanvasIcon.id)
      if (isMobile) setMobileView("canvas")
    },
    [isMobile],
  )

  const handleUpdateIcon = useCallback((id: string, updates: Partial<CanvasIcon>) => {
    setCanvasIcons((prev) => prev.map((icon) => (icon.id === id ? { ...icon, ...updates } : icon)))
  }, [])

  const handleDeleteIcon = useCallback(
    (id: string) => {
      setCanvasIcons((prev) => prev.filter((icon) => icon.id !== id))
      if (selectedIconId === id) setSelectedIconId(null)
    },
    [selectedIconId],
  )

  const handleClearCanvas = useCallback(() => {
    setCanvasIcons(() => [])
    setSelectedIconId(null)
    setSavedCanvasImage(null)
    setSearchQuery("")
    setAiSearchQuery("")
    setCanvasKey((prev) => prev + 1)

    try {
      // Clear both drawing strokes
      desktopCanvasRef.current?.clear()
      mobileCanvasRef.current?.clear()
    } catch (error) {
      console.error("Failed to clear drawing canvas:", error)
    }

    toast.success("Canvas cleared")
  }, [])

  const handleAISearch = useCallback(
    (query: string) => {
      setAiSearchQuery(query)
      setSearchQuery(query)
      if (isMobile) setMobileView("search")
    },
    [isMobile],
  )

  const handleDuplicateIcon = useCallback(
    (id: string) => {
      const iconToDuplicate = canvasIcons.find((icon) => icon.id === id)
      if (iconToDuplicate) {
        const newIcon: CanvasIcon = {
          ...iconToDuplicate,
          id: `${iconToDuplicate.icon.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: iconToDuplicate.x + 30,
          y: iconToDuplicate.y + 30,
        }
        setCanvasIcons((prev) => [...prev, newIcon])
        setSelectedIconId(newIcon.id)
      }
    },
    [canvasIcons],
  )

  return (
    <CollaborationProvider>
      <div className="flex flex-col h-dvh overflow-hidden bg-background transition-colors duration-300">
        <AnimatePresence>{showWelcome && <WelcomeOverlay onClose={() => setShowWelcome(false)} />}</AnimatePresence>

        <Header
          onClear={handleClearCanvas}
          iconCount={canvasIcons.length}
          mobileView={mobileView}
          onMobileViewChange={setMobileView}
          isMobile={isMobile}
          onOpenEditor={() => setShowEditor(true)}
        />

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          {/* Drawing Canvas - Left Side */}
          <div className="flex-1 relative flex flex-col">
            <DrawingCanvas
              key={`desktop-${canvasKey}`}
              ref={desktopCanvasRef}
              icons={canvasIcons}
              selectedIconId={selectedIconId}
              onSelectIcon={setSelectedIconId}
              onUpdateIcon={handleUpdateIcon}
              onDeleteIcon={handleDeleteIcon}
              onAddIcon={handleAddIconToCanvas}
              onAISearch={handleAISearch}
              currentTool={currentTool}
              onToolChange={setCurrentTool}
              brushSettings={brushSettings}
              onBrushSettingsChange={setBrushSettings}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          </div>

          {/* Icon Customizer */}
          <AnimatePresence>
            {selectedIcon && !showEditor && (
              <IconCustomizer
                icon={selectedIcon}
                onUpdate={(updates) => handleUpdateIcon(selectedIcon.id, updates)}
                onDelete={() => handleDeleteIcon(selectedIcon.id)}
                onDuplicate={() => handleDuplicateIcon(selectedIcon.id)}
                onClose={() => setSelectedIconId(null)}
                onOpenEditor={() => setShowEditor(true)}
              />
            )}
          </AnimatePresence>

          {/* Search Panel - Right Side */}
          <IconSearchPanel
            onSelectIcon={handleAddIconToCanvas}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            aiSearchQuery={aiSearchQuery}
            setAiSearchQuery={setAiSearchQuery}
          />
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="flex lg:hidden flex-1 overflow-hidden relative">
          {/* Canvas View */}
          <div
            className={`absolute inset-0 transition-transform duration-300 touch-none ${mobileView === "canvas" ? "translate-x-0" : "-translate-x-full"}`}
          >
            <DrawingCanvas
              key={`mobile-${canvasKey}`}
              ref={mobileCanvasRef}
              icons={canvasIcons}
              selectedIconId={selectedIconId}
              onSelectIcon={setSelectedIconId}
              onUpdateIcon={handleUpdateIcon}
              onDeleteIcon={handleDeleteIcon}
              onAddIcon={handleAddIconToCanvas}
              onAISearch={handleAISearch}
              currentTool={currentTool}
              onToolChange={setCurrentTool}
              brushSettings={brushSettings}
              onBrushSettingsChange={setBrushSettings}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          </div>

          {/* Search View */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ${mobileView === "search" ? "translate-x-0" : "translate-x-full"}`}
          >
            <IconSearchPanel
              onSelectIcon={handleAddIconToCanvas}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              aiSearchQuery={aiSearchQuery}
              setAiSearchQuery={setAiSearchQuery}
              isMobile
            />
          </div>

          {/* Mobile Icon Customizer */}
          <AnimatePresence>
            {selectedIcon && mobileView === "canvas" && !showEditor && (
              <IconCustomizer
                icon={selectedIcon}
                onUpdate={(updates) => handleUpdateIcon(selectedIcon.id, updates)}
                onDelete={() => handleDeleteIcon(selectedIcon.id)}
                onDuplicate={() => handleDuplicateIcon(selectedIcon.id)}
                onClose={() => setSelectedIconId(null)}
                onOpenEditor={() => setShowEditor(true)}
                isMobile
              />
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Toolbar */}
        {isMobile && (
          <MobileToolbar
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            brushSettings={brushSettings}
            onBrushSettingsChange={setBrushSettings}
            mobileView={mobileView}
            onMobileViewChange={setMobileView}
          />
        )}

        {/* Full-Screen Canvas Editor */}
        {showEditor && (
          <CanvasEditor
            icons={canvasIcons}
            selectedIconId={selectedIconId}
            onSelectIcon={setSelectedIconId}
            onUpdateIcon={handleUpdateIcon}
            onUpdateAll={setCanvasIcons}
            onDeleteIcon={handleDeleteIcon}
            onDuplicateIcon={handleDuplicateIcon}
            onClose={() => setShowEditor(false)}
            isMobile={isMobile}
          />
        )}

        {/* Group Chat */}
        <GroupChat isMobile={isMobile} />

        <Toaster
          richColors
          position={isMobile ? "top-center" : "bottom-center"}
          toastOptions={{
            className: "glass-panel",
            duration: 3000,
          }}
        />
      </div>
    </CollaborationProvider>
  )
}

