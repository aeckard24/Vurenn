import { getFrontendEnv } from '@/lib/config/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const { supabaseUrl, supabaseAnonKey } = getFrontendEnv()
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase authentication is not configured for this deployment.',
    )
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}
