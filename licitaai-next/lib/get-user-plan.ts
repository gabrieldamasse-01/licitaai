/**
 * Helper server-side: retorna o plano normalizado do usuário.
 * Admin sempre retorna "pro" independente do plano cadastrado.
 */
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { normalizarPlano, type Plano } from "@/lib/plans"
import { isAdmin } from "@/lib/is-admin"

export async function getUserPlan(): Promise<Plano> {
  try {
    const adminOk = await isAdmin()
    if (adminOk) return "pro"

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return "gratuito"

    const service = createServiceClient()
    const { data } = await service
      .from("user_preferences")
      .select("plano")
      .eq("user_id", user.id)
      .maybeSingle()

    return normalizarPlano(data?.plano)
  } catch {
    return "gratuito"
  }
}
