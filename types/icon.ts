export interface IconData {
  name: string
  prefix: string
  body?: string
  url?: string
  width?: number
  height?: number
}

export interface CanvasIcon {
  id: string
  icon: IconData
  x: number
  y: number
  size: number
  color: string
  rotation: number
  opacity: number
}

export type Tool = "pen" | "eraser" | "select" | "fill"

export interface BrushSettings {
  size: number
  color: string
  opacity: number
}

export interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  textDecoration: string
  color: string
  textAlign: string
  opacity: number
  rotation: number
  effect?: string
  letterSpacing?: number
  lineHeight?: number
  strokeColor?: string
  strokeWidth?: number
}

export interface ImageElement {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
  rotation: number
}

export interface ShapeElement {
  id: string
  type: "rect" | "circle" | "line" | "triangle" | "star"
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  rotation: number
  cornerRadius?: number
  points?: number
}

export interface DrawingPath {
  points: { x: number; y: number }[]
  color: string
  size: number
}
