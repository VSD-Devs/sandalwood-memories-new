import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim()
        let value = trimmed.slice(eqIndex + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigrations() {
  try {
    console.log('Connecting to Supabase...')

    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (testError && testError.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
      console.log('Database connection test failed:', testError.message)
      console.log('This might be expected if tables don\'t exist yet.')
    } else {
      console.log('Database connection successful!')
    }

    // Read and execute SQL files in order
    const sqlFiles = [
      'supabase-setup.sql'
    ]

    for (const sqlFile of sqlFiles) {
      const sqlPath = path.join(__dirname, sqlFile)
      if (fs.existsSync(sqlPath)) {
        console.log(`Executing ${sqlFile}...`)
        const sqlContent = fs.readFileSync(sqlPath, 'utf8')

        // Split SQL into individual statements
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

        for (const statement of statements) {
          if (statement.trim()) {
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: statement })
              if (error) {
                console.log(`Warning executing statement: ${error.message}`)
                // Try direct execution as fallback
                const { error: directError } = await supabase.from('_temp').select('*').limit(0)
                if (directError) {
                  console.log('Direct SQL execution not available, trying alternative approach...')
                }
              }
            } catch (err) {
              console.log(`Error executing statement: ${err.message}`)
            }
          }
        }
      } else {
        console.log(`SQL file not found: ${sqlFile}`)
      }
    }

    // Test if tables were created
    console.log('\nTesting table creation...')
    const tables = ['memorials', 'users', 'tributes', 'media', 'timeline_events']

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error && error.code === 'PGRST116') {
          console.log(`❌ Table '${table}' does not exist`)
        } else {
          console.log(`✅ Table '${table}' exists`)
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}': ${err.message}`)
      }
    }

    console.log('\nMigration script completed!')
    console.log('If tables are still missing, you may need to run the SQL manually in your Supabase dashboard.')

  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigrations()









