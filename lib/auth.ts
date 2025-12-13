import { supabase } from "./database"
import bcrypt from "bcryptjs"

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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, provider_user_id, email_verified, created_at, updated_at')
      .eq('email', email)
      .single()

    if (error || !user) return null
    return user
  } catch (error) {
    console.warn('Database not available for user lookup:', error)
    return null
  }
}

export async function createUser(email: string, name: string, password: string): Promise<AuthUser> {
  try {
    const password_hash = await hashPassword(password)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash
      })
      .select('id, email, name, email_verified, created_at, updated_at')
      .single()

    if (error) {
      throw new Error('Database temporarily unavailable')
    }

    return user as AuthUser
  } catch (error) {
    console.error('Database not available for user creation:', error)
    throw new Error('Database temporarily unavailable')
  }
}

export async function markUserVerifiedByEmail(email: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      email_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('email', email)

  if (error) {
    console.error('Error marking user as verified:', error)
  }
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2)
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      session_token: token
    })
    .select('expires_at')
    .single()

  if (error) {
    throw new Error('Failed to create session')
  }

  const expiresAt = new Date(session.expires_at)
  return { token, expiresAt }
}

export async function getUserBySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        user_id,
        users (
          id,
          email,
          name,
          email_verified,
          created_at,
          updated_at
        )
      `)
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !session?.users) return null
    return session.users as AuthUser
  } catch (error) {
    console.warn('Database not available for session lookup:', error)
    return null
  }
}

export async function revokeSession(token: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('session_token', token)

  if (error) {
    console.error('Error revoking session:', error)
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const password_hash = await hashPassword(newPassword)
  const { error } = await supabase
    .from('users')
    .update({
      password_hash,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating password:', error)
  }
}

export async function updateUserEmail(userId: string, newEmail: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('users')
    .update({
      email: newEmail,
      email_verified: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('id, email, name, email_verified, created_at, updated_at')
    .single()

  if (error || !data) {
    console.error('Error updating email:', error)
    return null
  }

  return data as AuthUser
}

export async function createPasswordResetToken(email: string): Promise<{ token: string; expiresAt: string } | null> {
  const token = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

  const { error } = await supabase
    .from('password_resets')
    .insert({
      email,
      token,
      expires_at: expiresAt
    })

  if (error) {
    console.error('Error creating password reset token:', error)
    return null
  }

  return { token, expiresAt }
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('password_resets')
    .select('email, expires_at, used')
    .eq('token', token)
    .single()

  if (error || !data) return null
  if (data.used) return null
  if (new Date(data.expires_at).getTime() < Date.now()) return null
  return data.email
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  const { error } = await supabase
    .from('password_resets')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('token', token)

  if (error) {
    console.error('Error consuming password reset token:', error)
  }
}


