"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CanvasIcon } from "@/types/icon"

interface AiAnalysisPanelProps {
  icons: CanvasIcon[]
  onClose: () => void
}



export function AiAnalysisPanel({ icons, onClose }: AiAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const analyzeCanvas = useCallback(async () => {
    if (icons.length === 0) {
      setError("No icons on canvas to analyze")
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis("")

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const iconDescriptions = icons.map((icon) => ({
      name: icon.icon.name,
      collection: icon.icon.prefix,
      color: icon.color,
      size: icon.size,
      position: { x: Math.round(icon.x), y: Math.round(icon.y) },
      rotation: icon.rotation,
    }))

    const prompt = `Analyze this icon composition on a canvas. The user has placed the following icons:

${JSON.stringify(iconDescriptions, null, 2)}

Please provide:
1. A creative interpretation of what this composition might represent
2. Design suggestions to improve the composition
3. Color harmony analysis
4. Potential use cases for this icon arrangement (e.g., logo, infographic, illustration)

Keep your response concise, creative, and helpful. Use emojis where appropriate.`

    try {
      const response = await fetch("/api/analyze-composition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setAnalysis(data.text)
    } catch (err: any) {
      if (err.name === "AbortError") return
      console.error("Analysis failed:", err)
      setError(err.message || "Failed to analyze composition")
    } finally {
      setLoading(false)
    }
  }, [icons])

  useEffect(() => {
    analyzeCanvas()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: loading ? 360 : 0 }}
              transition={{ repeat: loading ? Number.POSITIVE_INFINITY : 0, duration: 2, ease: "linear" }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Canvas Analysis</h2>
              <p className="text-sm text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[300px] max-h-[500px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                >
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Analyzing your composition...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {icons.length} icon{icons.length !== 1 ? "s" : ""} detected
                  </p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4"
              >
                <AlertCircle className="w-12 h-12 text-destructive" />
                <div className="text-center">
                  <p className="font-medium text-foreground">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4 gap-2 bg-transparent"
                    onClick={() => {
                      analyzeCanvas()
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {analysis.split("\n").map((line, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${line.startsWith("#") || line.startsWith("*") ? "font-semibold" : ""} ${!line.trim() ? "h-2" : "mb-2"}`}
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {analysis && !loading && (
          <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Analysis based on {icons.length} icon{icons.length !== 1 ? "s" : ""}
            </p>
            <Button variant="outline" size="sm" onClick={analyzeCanvas} className="gap-2 bg-transparent">
              <RefreshCw className="w-4 h-4" />
              Re-analyze
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
