type RateRecord = {
  count: number
  firstRequestAt: number
}

// Use a global map so it survives hot reloads in dev and can be shared across imports in the same runtime
const globalAny = globalThis as unknown as { __mpRateLimit?: Map<string, RateRecord> }
const store: Map<string, RateRecord> = globalAny.__mpRateLimit || new Map<string, RateRecord>()
globalAny.__mpRateLimit = store

export function getClientIp(request: Request): string {
  // NextRequest extends Request; use common headers for IP
  const xff = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
  if (xff) return xff.split(",")[0]?.trim() || "unknown"
  // @ts-ignore
  const reqIp = (request as any).ip as string | undefined
  return reqIp || "unknown"
}

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing) {
    store.set(key, { count: 1, firstRequestAt: now })
    return { allowed: true }
  }

  const elapsed = now - existing.firstRequestAt
  if (elapsed > windowMs) {
    store.set(key, { count: 1, firstRequestAt: now })
    return { allowed: true }
  }

  if (existing.count < limit) {
    existing.count += 1
    return { allowed: true }
  }

  const retryAfter = Math.ceil((windowMs - elapsed) / 1000)
  return { allowed: false, retryAfter }
}


