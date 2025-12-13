import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionCookieName, getUserByEmail, getUserBySessionToken, updateUserEmail, verifyPassword } from "@/lib/auth"
import { validateCsrf } from "@/lib/csrf"
import { supabase } from "@/lib/database"
import { isResendAvailable, sendVerificationEmailResend } from "@/lib/email"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const changeEmailSchema = z.object({
  newEmail: z.string().email().max(254),
  currentPassword: z.string().min(8).max(256),
})

export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIp(request as any)
    const rl = checkRateLimit(`email-change:${ip}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } as any }
      )
    }

    if (!validateCsrf(request as any)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    const sessionToken = request.cookies.get(getSessionCookieName())?.value
    if (!sessionToken) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const sessionUser = await getUserBySessionToken(sessionToken)
    if (!sessionUser) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const parsed = changeEmailSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Please use a valid email and password" }, { status: 400 })
    }

    const newEmail = parsed.data.newEmail.trim().toLowerCase()
    const currentPassword = parsed.data.currentPassword

    if (newEmail === sessionUser.email.toLowerCase()) {
      return NextResponse.json({ error: "That is already your email address" }, { status: 400 })
    }

    const fullUser = await getUserByEmail(sessionUser.email)
    if (!fullUser) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const passwordOk = await verifyPassword(currentPassword, fullUser.password_hash)
    if (!passwordOk) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 400 })
    }

    const existing = await getUserByEmail(newEmail)
    if (existing && existing.id !== sessionUser.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const updated = await updateUserEmail(sessionUser.id, newEmail)
    if (!updated) {
      return NextResponse.json({ error: "Failed to update email" }, { status: 500 })
    }

    let verifyLink: string | null = null
    try {
      const verificationToken = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await supabase.from("email_verifications").delete().eq("email", newEmail)
      const { error: insertError } = await supabase.from("email_verifications").insert({
        email: newEmail,
        token: verificationToken,
        expires_at: expiresAt,
      })

      if (insertError) {
        throw insertError
      }

      const origin = request.headers.get("origin")?.replace(/\/$/, "") || process.env.APP_URL || "http://localhost:3000"
      const apiVerifyUrl = `${origin}/api/auth/verify/confirm?token=${verificationToken}`
      verifyLink = process.env.NODE_ENV === "production" ? null : `${origin}/verify/${verificationToken}`

      if (isResendAvailable()) {
        await sendVerificationEmailResend(newEmail, apiVerifyUrl)
      } else {
        console.log("Verification link:", apiVerifyUrl)
      }
    } catch (verifyError) {
      console.error("Failed to issue verification after email change", verifyError)
    }

    return NextResponse.json({
      ok: true,
      user: { id: updated.id, email: updated.email, name: updated.name, emailVerified: updated.email_verified },
      verifyLink,
    })
  } catch (error) {
    console.error("email change error", error)
    return NextResponse.json({ error: "Failed to update email" }, { status: 500 })
  }
}





