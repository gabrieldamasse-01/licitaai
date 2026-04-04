"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const feedbackSchema = z.object({
  tipo: z.enum(["bug", "sugestao", "elogio"]),
  titulo: z.string().min(3, "Título muito curto").max(120, "Título muito longo"),
  descricao: z.string().min(10, "Descreva melhor o problema ou sugestão").max(2000),
})

export type FeedbackData = z.infer<typeof feedbackSchema>

export async function enviarFeedback(
  data: FeedbackData,
): Promise<{ success?: boolean; error?: string }> {
  const parsed = feedbackSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    tipo: parsed.data.tipo,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao,
  })

  if (error) return { error: "Erro ao enviar feedback" }

  revalidatePath("/feedback")
  return { success: true }
}
