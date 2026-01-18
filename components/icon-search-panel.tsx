"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Loader2, Plus, Grid3X3, List, Sparkles, Package, X, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import type { IconData } from "@/types/icon"
import { cn } from "@/lib/utils"

interface IconSearchPanelProps {
  onSelectIcon: (icon: IconData) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  aiSearchQuery: string
  setAiSearchQuery: (query: string) => void
  isMobile?: boolean
  onClose?: () => void
}

const POPULAR_SEARCHES = [
  "home",
  "user",
  "settings",
  "arrow",
  "star",
  "heart",
  "search",
  "menu",
  "chart",
  "mail",
  "phone",
  "camera",
]

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download } from "lucide-react"

export function IconSearchPanel({
  onSelectIcon,
  searchQuery,
  setSearchQuery,
  aiSearchQuery,
  setAiSearchQuery,
  isMobile,
  onClose
}: IconSearchPanelProps) {
  const [icons, setIcons] = useState<IconData[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [previewIcon, setPreviewIcon] = useState<IconData | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchIcons = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIcons([])
      return
    }

    setLoading(true)
    try {
      // Prepend "svg" to ensuring vector-style results similar to the reference logic
      const term = `svg ${query}`
      const response = await fetch(`/api/search-icons?term=${encodeURIComponent(term)}`)
      const data = await response.json()

      if (data.data && Array.isArray(data.data)) {
        const fetchedIcons = data.data
          .map((item: any) => {
            const url = item.image?.source?.url
            if (!url) return null

            return {
              name: item.title || "Icon",
              prefix: "freepik",
              url: url,
              width: 24,
              height: 24,
            } as IconData
          })
          .filter(Boolean) as IconData[]
        setIcons(fetchedIcons)
      } else {
        setIcons([])
      }
    } catch (error) {
      console.error("Failed to search icons:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchIcons(searchQuery), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, searchIcons])

  const clearAISearch = () => {
    setAiSearchQuery("")
    setSearchQuery("")
    inputRef.current?.focus()
  }

  const handleDownload = async (icon: IconData) => {
    try {
      if (icon.url) {
        const response = await fetch(icon.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${icon.name}.png` // Default to png for freepik images
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (icon.body) {
        // Handle SVG download if needed
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width || 24} ${icon.height || 24}" fill="currentColor">${icon.body}</svg>`
        const blob = new Blob([svgContent], { type: "image/svg+xml" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${icon.name}.svg`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to download icon", error)
    }
  }

  return (
    <>
      <motion.aside
        initial={{ x: isMobile ? 0 : 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "border-l border-border bg-card/50 backdrop-blur-sm flex flex-col h-full",
          isMobile ? "w-full border-l-0" : "w-80 xl:w-96",
        )}
      >
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-border space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm">Icon Library</h2>
                <p className="text-[10px] text-muted-foreground">Freepik Powered</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
              {onClose && !isMobile && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (aiSearchQuery) setAiSearchQuery("")
              }}
              className="pl-10 pr-10 bg-background/80 border-border/50 focus:border-primary/50"
            />
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Search Indicator */}
          <AnimatePresence>
            {aiSearchQuery && searchQuery === aiSearchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs text-primary font-medium">AI-powered search</span>
                </div>
                <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-primary/20" onClick={clearAISearch}>
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Tags */}
          {!searchQuery && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Popular searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((term, index) => (
                  <motion.button
                    key={term}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchQuery(term)}
                    className="px-2.5 py-1 text-xs rounded-full bg-secondary/80 text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  >
                    {term}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <AnimatePresence mode="wait">
            {icons.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-3" // Always 2 columns for maximum size in the sidebar
                    : "flex flex-col gap-2",
                )}
              >
                {icons.map((icon, index) => (
                  <IconCard
                    key={`${icon.prefix}-${icon.name}-${index}`}
                    icon={icon}
                    index={index}
                    viewMode={viewMode}
                    onSelect={(icon) => setPreviewIcon(icon)}
                  />
                ))}
              </motion.div>
            ) : searchQuery && !loading ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 md:py-16"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Package className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground/50" />
                </div>
                <p className="text-foreground font-medium mb-1">No icons found</p>
                <p className="text-sm text-muted-foreground">Try a different search term</p>
              </motion.div>
            ) : !searchQuery ? (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 md:py-16"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
                  className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                >
                  <Search className="w-7 h-7 md:w-8 md:h-8 text-primary/60" />
                </motion.div>
                <p className="text-foreground font-medium mb-1">Search for icons</p>
                <p className="text-sm text-muted-foreground">Or draw on canvas and use AI</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Results count */}
        {icons.length > 0 && (
          <div className="p-2 md:p-3 border-t border-border bg-card/50">
            <p className="text-xs text-muted-foreground text-center">{icons.length} icons found</p>
          </div>
        )}
      </motion.aside>

      <Dialog open={!!previewIcon} onOpenChange={(open) => !open && setPreviewIcon(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{previewIcon?.name}</DialogTitle>
            <DialogDescription>
              {previewIcon?.prefix}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8 bg-muted/30 rounded-xl">
            {previewIcon?.url ? (
              <img src={previewIcon.url} alt={previewIcon.name} className="w-32 h-32 object-contain" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-foreground" dangerouslySetInnerHTML={{ __html: previewIcon?.body ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${previewIcon.width || 24} ${previewIcon.height || 24}" fill="currentColor">${previewIcon.body}</svg>` : '' }} />
            )}
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none gap-2"
              onClick={() => previewIcon && handleDownload(previewIcon)}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={() => {
                if (previewIcon) {
                  onSelectIcon(previewIcon)
                  setPreviewIcon(null)
                }
              }}
            >
              Import to Canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface IconCardProps {
  icon: IconData
  index: number
  viewMode: "grid" | "list"
  onSelect: (icon: IconData) => void
}

function IconCard({ icon, index, viewMode, onSelect }: IconCardProps) {
  const IconContent = () => {
    if (icon.url) {
      return (
        <img
          src={icon.url}
          alt={icon.name}
          className={cn(
            "object-contain pointer-events-none select-none",
            viewMode === "grid" ? "w-full h-full" : "w-full h-full"
          )}
        />
      )
    }

    if (icon.body) {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width || 24} ${icon.height || 24}" fill="currentColor">${icon.body}</svg>`
      return (
        <div
          className={cn(
            "flex items-center justify-center text-foreground shrink-0",
            viewMode === "grid" ? "w-full h-full" : "w-full h-full"
          )}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )
    }

    return <div className="bg-muted rounded-md w-full h-full" />
  }

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.015 }}
        className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-background/50 hover:bg-secondary/80 transition-all duration-200 group cursor-pointer border border-transparent hover:border-border"
        onClick={() => onSelect(icon)}
      >
        <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 flex items-center justify-center bg-muted/20 rounded-lg p-1">
          <IconContent />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
          <p className="text-sm font-medium truncate text-foreground">{icon.name}</p>
          <p className="text-xs text-muted-foreground truncate">{icon.prefix}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-7 h-7 md:w-8 md:h-8"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.01, type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onSelect(icon)}
      className="icon-card-hover aspect-square p-2 rounded-xl bg-background/50 hover:bg-primary hover:text-primary-foreground flex items-center justify-center group relative border border-transparent hover:border-primary/50 overflow-hidden"
      title={`${icon.prefix}:${icon.name}`}
    >
      <div className="w-full h-full p-1 transition-transform group-hover:scale-105 flex items-center justify-center">
        <IconContent />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-primary/95 rounded-xl"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </motion.div>
    </motion.button>
  )
}
