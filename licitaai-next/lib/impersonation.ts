/**
 * Utilitário de impersonação de cliente pelo admin.
 * Usar apenas em Server Components e API Routes.
 */
import { cookies } from "next/headers"
import { createServiceClient } from "./supabase/service"

export type ImpersonationContext = {
  impersonatingUserId: string | null
  impersonatedEmail: string | null
}

/**
 * Retorna o contexto de impersonação se o cookie estiver presente.
 * Busca o email do usuário impersonado via service client.
 */
export async function getImpersonationContext(): Promise<ImpersonationContext> {
  const cookieStore = await cookies()
  const impersonatingUserId = cookieStore.get("impersonating_user_id")?.value ?? null

  if (!impersonatingUserId) {
    return { impersonatingUserId: null, impersonatedEmail: null }
  }

  try {
    const service = createServiceClient()
    const { data: { user } } = await service.auth.admin.getUserById(impersonatingUserId)
    return {
      impersonatingUserId,
      impersonatedEmail: user?.email ?? null,
    }
  } catch {
    return { impersonatingUserId: null, impersonatedEmail: null }
  }
}

/**
 * Retorna apenas o user_id sendo impersonado (sem buscar email — mais leve).
 */
export async function getImpersonatingUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("impersonating_user_id")?.value ?? null
}
