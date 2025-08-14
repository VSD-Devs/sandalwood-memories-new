import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookieName, getUserBySessionToken, updateUserPassword, verifyPassword, getUserByEmail } from "@/lib/auth"
import { validateCsrf } from "@/lib/csrf"
import { z } from "zod"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const passwordSchema = z.object({
  currentPassword: z.string().min(0).max(256).optional(),
  newPassword: z.string().min(8).max(256),
})

// Update password (requires session)
export async function PUT(request: NextRequest) {
  try {
    // rate limit per IP
    const ip = getClientIp(request as any)
    const rl = checkRateLimit(`password:${ip}`, 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } as any })
    }

    if (!validateCsrf(request as any)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    const token = request.cookies.get(getSessionCookieName())?.value
    if (!token) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    const sessionUser = await getUserBySessionToken(token)
    if (!sessionUser) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const parsed = passwordSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    const { currentPassword, newPassword } = parsed.data

    // Verify current password
    const full = await getUserByEmail(sessionUser.email)
    if (!full) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    if (currentPassword) {
      const ok = await verifyPassword(currentPassword, full.password_hash)
      if (!ok) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 })
    }

    await updateUserPassword(sessionUser.id, newPassword)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("password update error", error)
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}


