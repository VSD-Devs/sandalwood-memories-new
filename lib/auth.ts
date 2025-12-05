import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

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

export interface AuthUser {
  id: string
  email: string
  name: string
  email_verified: boolean
  created_at: string
  updated_at: string
}

const SESSION_COOKIE_NAME = "mp_session"

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function getUserByEmail(email: string): Promise<(AuthUser & { password_hash: string; provider_user_id: string | null }) | null> {
  try {
    const rows = await getSql()`
      SELECT id, email, name, password_hash, provider_user_id, email_verified, created_at, updated_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    const row = rows[0] as any
    if (!row) return null
    return row
  } catch (error) {
    console.warn('Database not available for user lookup:', error)
    return null
  }
}

export async function createUser(email: string, name: string, password: string): Promise<AuthUser> {
  try {
    const password_hash = await hashPassword(password)
    const rows = await getSql()`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${password_hash})
      RETURNING id, email, name, email_verified, created_at, updated_at
    `
    return rows[0] as AuthUser
  } catch (error) {
    console.error('Database not available for user creation:', error)
    throw new Error('Database temporarily unavailable')
  }
}

export async function markUserVerifiedByEmail(email: string): Promise<void> {
  await getSql()`UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE email = ${email}`
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2)
  const rows = await getSql()`
    INSERT INTO sessions (user_id, session_token)
    VALUES (${userId}, ${token})
    RETURNING expires_at
  `
  const expiresAt = new Date(rows[0].expires_at)
  return { token, expiresAt }
}

export async function getUserBySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const rows = await getSql()`
      SELECT u.id, u.email, u.name, u.email_verified, u.created_at, u.updated_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    const row = rows[0] as any
    if (!row) return null
    return row as AuthUser
  } catch (error) {
    console.warn('Database not available for session lookup:', error)
    return null
  }
}

export async function revokeSession(token: string): Promise<void> {
  await getSql()`DELETE FROM sessions WHERE session_token = ${token}`
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const password_hash = await hashPassword(newPassword)
  await getSql()`UPDATE users SET password_hash = ${password_hash}, updated_at = NOW() WHERE id = ${userId}`
}


