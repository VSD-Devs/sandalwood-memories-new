import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail, createSession, getSessionCookieName } from "@/lib/auth"
import { getAuthProvider } from "@/lib/utils"
import { z } from "zod"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
  name: z.string().min(1).max(120),
})

export async function POST(request: NextRequest) {
  try {
    // rate limit per IP
    const ip = getClientIp(request as any)
    const rl = checkRateLimit(`signup:${ip}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } as any })
    }

    const parsed = signupSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { email, password, name } = parsed.data
    const provider = getAuthProvider()
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
    const user = await createUser(email, name, password)
    const { token, expiresAt } = await createSession(user.id)
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, emailVerified: user.email_verified } })
    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      expires: expiresAt,
      path: "/",
    })
    return res
  } catch (error) {
    console.error("signup error", error)
    return NextResponse.json({ error: "Failed to sign up" }, { status: 500 })
  }
}


