import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local
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

const databaseUrl = process.env.DATABASE_URL_UNPOOLED

if (!databaseUrl) {
  console.error('Missing DATABASE_URL_UNPOOLED environment variable')
  process.exit(1)
}

async function executeSQL(sqlFile) {
  // Parse connection string and ensure SSL is properly configured
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    const sqlPath = path.join(__dirname, sqlFile)
    if (!fs.existsSync(sqlPath)) {
      console.error(`SQL file not found: ${sqlPath}`)
      process.exit(1)
    }

    console.log(`Reading SQL file: ${sqlFile}`)
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('Connecting to database...')
    await client.connect()
    console.log('✅ Connected to database')

    console.log('\nExecuting SQL statements...')
    await client.query(sqlContent)
    
    console.log('✅ All SQL statements executed successfully!')
  } catch (error) {
    console.error('❌ Failed to execute SQL:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: node scripts/run-sql.mjs <sql-file>')
  process.exit(1)
}

executeSQL(sqlFile)

