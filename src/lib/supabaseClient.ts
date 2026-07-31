import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project credentials.',
  )
}

// No generated Database types (hand-written schema, no codegen) — query results
// are cast to the domain types in ../types/database at the call site instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
