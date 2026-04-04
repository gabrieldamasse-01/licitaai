/**
 * Helper para verificar se o usuário autenticado é admin.
 * Usar apenas em Server Components, Server Actions ou API Routes.
 * NUNCA importe em Client Components.
 */
import { createClient } from "@/lib/supabase/server"

const MASTER_EMAIL = "gabriel.damasse@mgnext.com"

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    // Email master é sempre admin
    if (user.email === MASTER_EMAIL) return true

    // Verificar na tabela admin_users
    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .maybeSingle()

    if (error) return false

    return data !== null
  } catch {
    return false
  }
}

export async function getAdminUser(): Promise<{
  user: { id: string; email: string } | null
  isAdmin: boolean
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { user: null, isAdmin: false }

    const userInfo = { id: user.id, email: user.email ?? "" }

    // Email master é sempre admin
    if (user.email === MASTER_EMAIL) {
      return { user: userInfo, isAdmin: true }
    }

    // Verificar na tabela admin_users
    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .maybeSingle()

    if (error) return { user: userInfo, isAdmin: false }

    return { user: userInfo, isAdmin: data !== null }
  } catch {
    return { user: null, isAdmin: false }
  }
}
