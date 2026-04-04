"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const OnboardingSchema = z.object({
  razao_social: z.string().min(2, "Informe a razão social"),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido (formato: 00.000.000/0000-00)"),
  porte: z.enum(["MEI", "ME", "EPP", "MEDIO", "GRANDE"]),
  contato: z.string().optional(),
  email_contato: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  cnaes: z.array(z.string()).min(1, "Adicione ao menos um CNAE"),
})

export type OnboardingData = z.infer<typeof OnboardingSchema>

export async function criarEmpresaOnboarding(
  data: OnboardingData,
): Promise<{ error: string } | { success: true }> {
  const parsed = OnboardingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { cnaes, ...rest } = parsed.data

  const { error } = await supabase.from("companies").insert({
    ...rest,
    cnpj: parsed.data.cnpj.replace(/\D/g, ""),
    cnae: cnaes,
    user_id: user.id,
  })

  if (error) {
    if (error.code === "23505") return { error: "CNPJ já cadastrado" }
    return { error: "Erro ao cadastrar empresa" }
  }

  // Notificação de boas-vindas
  await supabase.from("notifications").insert({
    user_id: user.id,
    tipo: "boas_vindas",
    titulo: "Bem-vindo ao LicitaAI! 🎉",
    mensagem: `Sua empresa ${parsed.data.razao_social} foi cadastrada. Já estamos buscando oportunidades para você.`,
    link: "/oportunidades",
  })

  return { success: true as const }
}
