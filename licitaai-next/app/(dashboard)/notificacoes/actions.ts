"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function marcarComoLida(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("id", id)
    .eq("user_id", user.id) // RLS extra

  if (error) return { error: error.message }
  revalidatePath("/notificacoes")
  return {}
}

export async function marcarTodasComoLidas(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("user_id", user.id)
    .eq("lida", false)

  if (error) return { error: error.message }
  revalidatePath("/notificacoes")
  return {}
}
