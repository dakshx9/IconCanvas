import { NextResponse } from "next/server";

const API_KEY = "FPSX21a20ccba95d9dc387a6334acf9635a3";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term");

    if (!term) {
        return NextResponse.json({ error: "Missing term parameter" }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://api.freepik.com/v1/resources?term=${encodeURIComponent(term)}&limit=50`,
            {
                headers: {
                    "x-freepik-api-key": API_KEY,
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Freepik API responded with ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Freepik API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch from Freepik", details: String(error) },
            { status: 500 }
        );
    }
}
