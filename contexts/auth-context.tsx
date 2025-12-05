"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, name?: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  sendVerificationEmail: () => Promise<string | null>
  verifyEmail: (token: string) => boolean
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("memorial-user")
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
      } catch {
        // ignore parse errors
      }
    }
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: 'include'
        })
        const data = await res.json()
        if (data?.user) {
          const nextUser: User = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            emailVerified: Boolean(data.user.emailVerified),
          }
          setUser(nextUser)
          localStorage.setItem("memorial-user", JSON.stringify(nextUser))
        } else {
          // Server says no user, clear local storage
          setUser(null)
          localStorage.removeItem("memorial-user")
        }
      } catch {
        // Network error - keep local user if exists but mark as potentially invalid
        console.warn("Failed to verify session with server")
      }
      setIsLoading(false)
    })()
  }, [])

  const login = async (email: string, password: string, name?: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // If name is provided, attempt signup; otherwise login
      const endpoint = name ? "/api/auth/signup" : "/api/auth/login"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(name ? { email, password, name } : { email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data?.user) {
        setIsLoading(false)
        return false
      }
      const nextUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        emailVerified: Boolean(data.user.emailVerified),
      }
      setUser(nextUser)
      localStorage.setItem("memorial-user", JSON.stringify(nextUser))
      setIsLoading(false)
      return true
    } catch {
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("memorial-user")
    // Best-effort server logout
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
  }

  const sendVerificationEmail = async (): Promise<string | null> => {
    if (!user) return null
    try {
      const res = await fetch("/api/auth/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
      if (!res.ok) return null
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      // The user will ultimately click the emailed link which hits the API, but we return a UX link to the pretty page
      const prettyLink = `${origin}/verify/${""}`
      return prettyLink
    } catch {
      return null
    }
  }

  const verifyEmail = (_token: string): boolean => {
    // Deprecated in favour of server verification. Left for type compatibility.
    return false
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false
    try {
      // attach CSRF token from cookie
      const csrf = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("mp_csrf="))
        ?.split("=")[1]
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf || "" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  const value = {
    user,
    login,
    logout,
    isLoading,
    sendVerificationEmail,
    verifyEmail,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
