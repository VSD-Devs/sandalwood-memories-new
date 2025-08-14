import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookieName, revokeSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(getSessionCookieName())?.value
    if (token) {
      await revokeSession(token)
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(getSessionCookieName(), "", { httpOnly: true, expires: new Date(0), path: "/" })
    return res
  } catch (error) {
    console.error("logout error", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}


