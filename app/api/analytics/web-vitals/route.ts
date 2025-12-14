import { NextResponse, type NextRequest } from "next/server"

interface WebVitalsPayload {
  name: string
  value: number
  id: string
  delta: number
  timestamp: number
  url: string
  userAgent: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebVitalsPayload = await request.json()

    // Validate the payload
    if (!payload.name || typeof payload.value !== 'number') {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Log the performance metric (in production, you'd want to store this)
    console.log(`[Analytics] Web Vital - ${payload.name}:`, {
      value: payload.value,
      url: payload.url,
      timestamp: new Date(payload.timestamp).toISOString()
    })

    // In production, you might want to:
    // 1. Store in a database (PostgreSQL, Redis, etc.)
    // 2. Send to external analytics (Google Analytics, Vercel Analytics, etc.)
    // 3. Aggregate and monitor for performance regressions

    // For now, just return success
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Web vitals analytics error:", error)
    return NextResponse.json({ error: "Failed to process analytics" }, { status: 500 })
  }
}
