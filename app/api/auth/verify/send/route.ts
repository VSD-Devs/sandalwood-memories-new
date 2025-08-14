import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendVerificationEmailResend, isResendAvailable } from "@/lib/email"

function getSql() {
  const rawCandidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  const candidates = rawCandidates
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v!.trim().replace(/^postgres:\/\//, "postgresql://"))
  for (const url of candidates) {
    try {
      return neon(url)
    } catch {}
  }
  throw new Error("DATABASE_URL is not set")
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const token = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2)

    const sql = getSql()
    await sql`
      INSERT INTO email_verifications (email, token)
      VALUES (${email}, ${token})
    `

    const origin = request.headers.get("origin") || process.env.APP_URL || "http://localhost:3000"
    const verifyUrl = `${origin}/api/auth/verify/confirm?token=${token}`

    if (isResendAvailable()) {
      await sendVerificationEmailResend(email, verifyUrl)
    } else {
      console.log("Verification link:", verifyUrl)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("send verification error", error)
    return NextResponse.json({ error: "Failed to send verification" }, { status: 500 })
  }
}


