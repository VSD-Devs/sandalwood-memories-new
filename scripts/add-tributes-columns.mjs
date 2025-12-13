import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkColumns() {
  try {
    console.log('Checking current tributes table structure...')

    // Try to select from tributes to see if it has the required columns
    const { data, error } = await supabase
      .from('tributes')
      .select('id, status, ip_address, user_agent, updated_at')
      .limit(1)

    if (error) {
      console.log('Error querying tributes table:', error.message)
      return { hasStatus: false, hasIpAddress: false, hasUserAgent: false, hasUpdatedAt: false }
    }

    // If we can select these columns without error, they exist
    console.log('✅ All required columns appear to exist')
    return { hasStatus: true, hasIpAddress: true, hasUserAgent: true, hasUpdatedAt: true }

  } catch (error) {
    console.error('Error checking columns:', error)
    return { hasStatus: false, hasIpAddress: false, hasUserAgent: false, hasUpdatedAt: false }
  }
}

async function testTributeOperations() {
  try {
    console.log('Testing tribute operations...')

    // Test creating a tribute with the new schema
    const testData = {
      memorial_id: '00000000-0000-0000-0000-000000000000', // dummy ID
      author_name: 'Test User',
      author_email: 'test@example.com',
      message: 'Test message',
      status: 'approved'
    }

    const { data, error } = await supabase
      .from('tributes')
      .insert(testData)
      .select()
      .single()

    if (error) {
      console.log('Error creating test tribute:', error.message)
      return false
    }

    console.log('✅ Successfully created test tribute')

    // Clean up test tribute
    if (data?.id) {
      await supabase.from('tributes').delete().eq('id', data.id)
      console.log('✅ Cleaned up test tribute')
    }

    return true
  } catch (error) {
    console.error('Error testing tribute operations:', error)
    return false
  }
}

async function main() {
  const columns = await checkColumns()
  console.log('Column status:', columns)

  const operationsWork = await testTributeOperations()

  if (operationsWork) {
    console.log('✅ Tribute operations are working correctly')
  } else {
    console.log('❌ Tribute operations are failing - schema may need manual migration')
  }
}

main()
