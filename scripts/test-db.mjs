// Minimal, safe DB connectivity check. Prints only status, no secrets.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

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

function getSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim()
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return { supabaseUrl, supabaseServiceKey }
}

async function checkTables(supabase) {
  const tables = ['memorials', 'users', 'tributes', 'media', 'timeline_events']
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id', { count: 'exact', head: true }).limit(1)
      if (error?.code === 'PGRST116') {
        console.log(`table:${table}:missing`)
      } else if (error) {
        console.log(`table:${table}:err:${error.code || error.message}`)
      } else {
        console.log(`table:${table}:present`)
      }
    } catch (e) {
      console.log(`table:${table}:err:${e?.message || 'unknown'}`)
    }
  }
}

async function main() {
  const cwd = path.join(__dirname, '..')
  loadDotenvLocal(cwd)

  const config = getSupabaseConfig()
  if (!config) {
    console.log('status:no-supabase-env')
    return
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' }).limit(1)
    if (error && error.code !== 'PGRST116') {
      console.log('connect:err:' + (error.code || error.message))
    } else {
      console.log('connect:ok')
    }
  } catch (e) {
    const code = e && (e.code || e.name || 'unknown')
    const message = e && e.message ? `:${e.message}` : ''
    console.log('connect:err:' + String(code) + message)
    if (e?.stack) {
      console.log('stack:' + String(e.stack).split('\n')[0])
    }
    return
  }

  await checkTables(supabase)
}

main()


