import crypto from "node:crypto"

const COOKIE_NAME = "mp_csrf"
const HEADER_NAME = "x-csrf-token"

export function getCsrfCookieName() {
  return COOKIE_NAME
}

export function getCsrfHeaderName() {
  return HEADER_NAME
}

export function createCsrfToken(): string {
  return crypto.randomBytes(16).toString("hex")
}

export function validateCsrf(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || ""
  const cookieToken = parseCookie(cookieHeader)[COOKIE_NAME]
  const headerToken = request.headers.get(HEADER_NAME)
  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

function parseCookie(cookie: string): Record<string, string> {
  return cookie
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce((acc: Record<string, string>, part) => {
      const [k, ...rest] = part.split("=")
      acc[k] = decodeURIComponent(rest.join("="))
      return acc
    }, {})
}


