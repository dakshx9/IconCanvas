import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS || "").split(",").map(k => k.trim()).filter(k => k)

if (GEMINI_API_KEYS.length === 0) {
  console.warn("No GEMINI_API_KEYS found in environment variables")
}

let currentKeyIndex = 0
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2500

async function analyzeWithGemini(base64Image: string): Promise<string[]> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()

  for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
    try {
      const apiKey = GEMINI_API_KEYS[currentKeyIndex]
      const genAI = new GoogleGenerativeAI(apiKey)
      // Updated to match the specific model version from the reference hackathon project
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" })

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
        `Analyze this drawing and identify what objects, symbols, or concepts are shown.
         Return ONLY a comma-separated list of 3-5 simple keywords that would be useful for searching icons.
         Focus on the main recognizable shapes and objects.
         Examples: "home, house, building" or "user, person, profile" or "star, sparkle, favorite"
         Be concise and use common icon search terms.`,
      ])

      const response = await result.response
      const text = response.text()

      const keywords = text
        .replace(/['"]/g, "")
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0 && k.length < 20)
        .slice(0, 5)

      return keywords
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`API key ${currentKeyIndex} failed:`, errorMessage)

      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length

      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      if (attempt === GEMINI_API_KEYS.length - 1) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return []
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const keywords = await analyzeWithGemini(image)

    return NextResponse.json({ keywords })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error analyzing drawing:", errorMessage)
    return NextResponse.json({ error: "Failed to analyze drawing", details: errorMessage }, { status: 500 })
  }
}
