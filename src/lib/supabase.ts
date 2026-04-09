import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anon

declare global {
  var __supabase: SupabaseClient | undefined
  var __supabaseAdmin: SupabaseClient | undefined
}

const getSupabaseClient = () => {
  if (!globalThis.__supabase) {
    globalThis.__supabase = createClient(url, anon)
  }
  return globalThis.__supabase
}

const getSupabaseAdminClient = () => {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin can only be used on the server")
  }
  if (!globalThis.__supabaseAdmin) {
    globalThis.__supabaseAdmin = createClient(url, svc)
  }
  return globalThis.__supabaseAdmin
}

export const supabase = getSupabaseClient()
export const getSupabaseAdmin = getSupabaseAdminClient