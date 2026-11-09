import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

declare global {
  var __supabase: SupabaseClient | undefined
}

const getSupabaseClient = () => {
  if (!globalThis.__supabase) {
    globalThis.__supabase = createClient(url, anon)
  }
  return globalThis.__supabase
}

export const supabase = getSupabaseClient()