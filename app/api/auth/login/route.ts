import { type NextRequest, NextResponse } from "next/server"
import { createSession, getUserByEmail, verifyPassword, getSessionCookieName } from "@/lib/auth"
import { getAuthProvider } from "@/lib/utils"
import { z } from "zod"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
})

export async function POST(request: NextRequest) {
  try {
    // rate limit per IP
    const ip = getClientIp(request as any)
    const rl = checkRateLimit(`login:${ip}`, 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } as any })
    }

    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { email, password } = parsed.data

    // For future switch to Neon, we route based on provider here
    const provider = getAuthProvider()
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { token, expiresAt } = await createSession(user.id)
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.email_verified },
    })
    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      expires: expiresAt,
      path: "/",
    })
    return res
  } catch (error) {
    console.error("login error", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}


