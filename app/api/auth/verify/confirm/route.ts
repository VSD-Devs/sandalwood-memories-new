import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/database"
import { markUserVerifiedByEmail } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const { data: record, error } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("token", token)
      .maybeSingle()

    if (error || !record) {
      return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 })
    }
    if (record.verified) {
      return NextResponse.json({ ok: true, already: true })
    }

    const expiresAt = new Date(record.expires_at)
    if (Number.isNaN(expiresAt.getTime()) || new Date() > expiresAt) {
      return NextResponse.json({ ok: false, reason: "expired" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("token", token)

    if (updateError) {
      console.error("Failed to mark verification as used", updateError)
      return NextResponse.json({ error: "Failed to verify" }, { status: 500 })
    }

    try {
      await markUserVerifiedByEmail(record.email)
    } catch (err) {
      console.error("Failed to flag user as verified", err)
    }

    return NextResponse.json({ ok: true, email: record.email })
  } catch (error) {
    console.error("confirm verification error", error)
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 })
  }
}


