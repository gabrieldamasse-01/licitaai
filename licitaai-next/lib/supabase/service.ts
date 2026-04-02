/**
 * Cliente Supabase com service_role — para uso exclusivo em API Routes e
 * Edge Functions server-side. NUNCA importe em Client Components.
 *
 * Bypassa RLS: use apenas em operações de sistema (cron, agentes, etc.).
 */
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para o service client',
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
