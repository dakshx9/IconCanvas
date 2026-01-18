import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS || "").split(",").map(k => k.trim()).filter(k => k)

if (GEMINI_API_KEYS.length === 0) {
    console.warn("No GEMINI_API_KEYS found in environment variables")
}

let currentKeyIndex = 0

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
        }

        if (GEMINI_API_KEYS.length === 0) {
            return NextResponse.json({ error: "Server configuration error: Missing API keys" }, { status: 500 })
        }

        let lastError = null

        // Try keys in rotation
        for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
            try {
                const apiKey = GEMINI_API_KEYS[currentKeyIndex]
                const genAI = new GoogleGenerativeAI(apiKey)
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" })

                const result = await model.generateContent(prompt)
                const response = await result.response
                const text = response.text()

                // Move to next key for next request
                currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length

                return NextResponse.json({ text })

            } catch (error: any) {
                lastError = error
                console.error(`Attempt with key ${currentKeyIndex} failed:`, error.message)

                // Move to next key immediately on failure
                currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length

                // If rate limited or permission denied, continue loop
                if (error.status === 429 || error.status === 403 || error.message?.includes('429') || error.message?.includes('403')) {
                    continue
                }

                // For other errors, maybe break? But for robustness in hackathon, let's try next key anyway 
                // unless it's a bad request or something persistent.
                continue
            }
        }

        throw lastError || new Error("All API attempts failed")

    } catch (error) {
        console.error("Composition analysis failed:", error)
        return NextResponse.json(
            { error: "Failed to analyze composition" },
            { status: 500 }
        )
    }
}
