// Minimal, safe DB connectivity check. Prints only status, no secrets.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadDotenvLocal(cwd) {
  try {
    const envPath = path.join(cwd, '.env.local')
    const raw = fs.readFileSync(envPath, 'utf8')
    const lines = raw.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch {}
}

function getDatabaseUrl() {
  const candidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  let url = candidates.find(v => typeof v === 'string' && v.trim().length > 0)
  if (!url) return null
  url = url.trim()
  if (url.startsWith('postgres://')) url = url.replace('postgres://', 'postgresql://')
  return url
}

async function main() {
  const cwd = path.join(__dirname, '..')
  loadDotenvLocal(cwd)
  const url = getDatabaseUrl()
  if (!url) {
    console.log('status:no-db-url')
    return
  }
  let neon
  try {
    ;({ neon } = await import('@neondatabase/serverless'))
  } catch {
    console.log('status:no-neon')
    return
  }
  try {
    const sql = neon(url)
    await sql`select 1`
    console.log('connect:ok')
    try {
      const r = await sql`select to_regclass('public.memorials') as t`
      console.log('table:memorials:' + (r?.[0]?.t ? 'present' : 'missing'))
    } catch { console.log('table:memorials:err') }
    try {
      const r = await sql`select to_regclass('public.users') as t`
      console.log('table:users:' + (r?.[0]?.t ? 'present' : 'missing'))
    } catch { console.log('table:users:err') }
    try {
      const r = await sql`select to_regclass('neon_auth.users_sync') as t`
      console.log('table:neon_auth.users_sync:' + (r?.[0]?.t ? 'present' : 'missing'))
    } catch { console.log('table:neon_auth.users_sync:err') }
    try {
      const r = await sql`select 1 from neon_auth.users_sync limit 1`
      console.log('select:neon_auth.users_sync:ok')
    } catch {
      console.log('select:neon_auth.users_sync:err')
    }
  } catch (e) {
    const code = e && (e.code || e.name || e.message || 'unknown')
    console.log('connect:err:' + String(code))
  }
}

main()


