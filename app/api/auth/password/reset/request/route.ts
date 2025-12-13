import { NextResponse, type NextRequest } from "next/server"
import { getUserByEmail, createPasswordResetToken } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  email: z.string().email().max(254),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 })
    }

    const { email } = parsed.data
    const user = await getUserByEmail(email)

    // Avoid leaking which emails exist: return 200 either way
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists, we’ve sent reset instructions.",
      })
    }

    const tokenInfo = await createPasswordResetToken(email)
    if (!tokenInfo) {
      return NextResponse.json({ error: "Unable to start reset right now." }, { status: 500 })
    }

    // TODO: hook up email delivery. For now, return token in dev for convenience.
    return NextResponse.json({
      ok: true,
      message: "Password reset started.",
      token: process.env.NODE_ENV === "production" ? undefined : tokenInfo.token,
    })
  } catch (error) {
    console.error("password reset request error", error)
    return NextResponse.json({ error: "Failed to start reset." }, { status: 500 })
  }
}













