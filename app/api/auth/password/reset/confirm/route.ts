import { NextResponse, type NextRequest } from "next/server"
import { updateUserPassword, verifyPasswordResetToken, consumePasswordResetToken, getUserByEmail } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(256),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reset payload." }, { status: 400 })
    }

    const { token, newPassword } = parsed.data
    const email = await verifyPasswordResetToken(token)
    if (!email) {
      return NextResponse.json({ error: "Reset link is invalid or has expired." }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 })
    }

    await updateUserPassword(user.id, newPassword)
    await consumePasswordResetToken(token)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("password reset confirm error", error)
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 })
  }
}










