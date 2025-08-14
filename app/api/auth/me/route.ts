import { type NextRequest, NextResponse } from "next/server"
import { getUserBySessionToken, getSessionCookieName } from "@/lib/auth"
import { createCsrfToken, getCsrfCookieName } from "@/lib/csrf"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(getSessionCookieName())?.value
    if (!token) return NextResponse.json({ user: null })
    const user = await getUserBySessionToken(token)
    if (!user) return NextResponse.json({ user: null })

    // issue/update CSRF cookie alongside session checks
    const csrf = createCsrfToken()
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, emailVerified: user.email_verified } })
    res.cookies.set(getCsrfCookieName(), csrf, { httpOnly: false, sameSite: "lax", secure: true, path: "/" })
    return res
  } catch (error) {
    console.error("me error", error)
    return NextResponse.json({ user: null })
  }
}


