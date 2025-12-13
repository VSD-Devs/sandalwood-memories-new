import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendVerificationEmailResend, isResendAvailable } from "@/lib/email"
import { supabase } from "@/lib/database"
import { getUserByEmail } from "@/lib/auth"

const requestSchema = z.object({
  email: z.string().email().max(254),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Account not found for that email" }, { status: 404 })
    }

    const token = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Replace any previous tokens for this email to avoid clutter
    await supabase.from("email_verifications").delete().eq("email", email)

    const { error: insertError } = await supabase.from("email_verifications").insert({
      email,
      token,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error("Failed to store verification token", insertError)
      return NextResponse.json({ error: "Could not start verification" }, { status: 500 })
    }

    const origin =
      request.headers.get("origin")?.replace(/\/$/, "") || process.env.APP_URL || "http://localhost:3000"
    const apiVerifyUrl = `${origin}/api/auth/verify/confirm?token=${token}`
    const friendlyVerifyUrl = `${origin}/verify/${token}`

    if (isResendAvailable()) {
      await sendVerificationEmailResend(email, apiVerifyUrl)
    } else {
      // Fallback for local/dev where email delivery is not wired up
      console.log("Verification link:", apiVerifyUrl)
    }

    const safeLink = process.env.NODE_ENV === "production" ? null : friendlyVerifyUrl
    const responseBody: Record<string, unknown> = { ok: true }
    if (safeLink) responseBody.link = safeLink
    if (process.env.NODE_ENV !== "production") responseBody.token = token

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error("send verification error", error)
    return NextResponse.json({ error: "Failed to send verification" }, { status: 500 })
  }
}


