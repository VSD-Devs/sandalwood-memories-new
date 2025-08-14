import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAuthProvider(): 'local' | 'neon' {
  const provider = (process.env.AUTH_PROVIDER || 'local').toLowerCase()
  return provider === 'neon' ? 'neon' : 'local'
}
