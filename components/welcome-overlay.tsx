"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Pencil, Layers, Search, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeOverlayProps {
  onClose: () => void
}

const features = [
  { icon: Pencil, title: "Draw Anything", description: "Sketch ideas" },
  { icon: Sparkles, title: "AI Search", description: "AI finds icons" },
  { icon: Search, title: "Manual Search", description: "200k+ icons" },
  { icon: Layers, title: "Compose", description: "Style & arrange" },
]

export function WelcomeOverlay({ onClose }: WelcomeOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 max-w-sm w-full"
        >
          <div className="glass-panel rounded-2xl p-5 md:p-6 text-center border border-white/10 shadow-2xl">
            {/* Compact Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 15 }}
              className="relative w-10 h-10 md:w-12 md:h-12 mx-auto mb-3"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl animate-pulse-glow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl font-bold mb-1 text-balance"
            >
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                IconCanvas AI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xs md:text-sm text-muted-foreground mb-4 text-balance"
            >
              Sketch ideas. Let AI find the icons.
            </motion.p>

            {/* Features - Compact Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-2 mb-5"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="p-2 md:p-3 rounded-lg bg-secondary/40 border border-white/5 text-left"
                >
                  <feature.icon className="w-4 h-4 text-primary mb-1" />
                  <h3 className="font-semibold text-foreground text-[11px] md:text-xs">{feature.title}</h3>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Button
                onClick={onClose}
                size="default"
                className="btn-premium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-5 py-2 h-10 text-sm rounded-xl shadow-lg shadow-primary/25 group w-full"
              >
                Start Creating
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-[9px] text-muted-foreground mt-3"
            >
              Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-secondary text-secondary-foreground font-mono">
                Enter
              </kbd>{" "}
              to start
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}