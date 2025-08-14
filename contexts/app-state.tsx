"use client"

import type React from "react"
import { createContext, useContext, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"

interface AppStateContextType {
  isActive: boolean
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  const value = useMemo<AppStateContextType>(() => {
    return { isActive: !!user && !isLoading }
  }, [user, isLoading])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}


