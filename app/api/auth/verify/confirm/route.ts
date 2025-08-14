import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { markUserVerifiedByEmail } from "@/lib/auth"

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const sql = getSql()
    const rows = await sql`
      SELECT * FROM email_verifications
      WHERE token = ${token}
      LIMIT 1
    `

    const row = rows[0] as any
    if (!row) {
      return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 })
    }
    if (row.verified) {
      return NextResponse.json({ ok: true, already: true })
    }
    const now = new Date()
    const expiresAt = new Date(row.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ ok: false, reason: "expired" }, { status: 400 })
    }

    await sql`
      UPDATE email_verifications
      SET verified = TRUE, verified_at = NOW()
      WHERE token = ${token}
    `

    try {
      await markUserVerifiedByEmail(row.email)
    } catch {}

    return NextResponse.json({ ok: true, email: row.email })
  } catch (error) {
    console.error("confirm verification error", error)
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 })
  }
}


