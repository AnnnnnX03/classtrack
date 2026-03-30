import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

let supabaseInstance = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createPagesBrowserClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  }
  return supabaseInstance
}

export const supabase = getSupabase()
