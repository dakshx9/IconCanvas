// Canvas Slide - Represents a single canvas/page in a presentation
export interface CanvasSlide {
    id: string
    name: string
    canvasW: number
    canvasH: number
    bgColor: string
    icons: import("./icon").CanvasIcon[]
    textElements: import("./icon").TextElement[]
    imageElements: import("./icon").ImageElement[]
    shapes: import("./icon").ShapeElement[]
    drawingPaths: { points: { x: number; y: number }[]; color: string; size: number }[]
    layerOrder: string[]
}

// Create a blank slide
export function createBlankSlide(name: string = "Untitled"): CanvasSlide {
    return {
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        canvasW: 800,
        canvasH: 600,
        bgColor: "#ffffff",
        icons: [],
        textElements: [],
        imageElements: [],
        shapes: [],
        drawingPaths: [],
        layerOrder: []
    }
}
