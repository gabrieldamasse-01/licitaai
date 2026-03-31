"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const empresaSchema = z.object({
  razao_social: z.string().min(1, "Razão social é obrigatória"),
  cnpj: z
    .string()
    .min(18, "CNPJ inválido")
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Formato inválido: XX.XXX.XXX/XXXX-XX"),
  porte: z.enum(["MEI", "ME", "EPP", "MEDIO", "GRANDE"]),
  cnae: z.string().optional(),
  email_contato: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  contato: z.string().optional(),
})

export type EmpresaFormData = z.infer<typeof empresaSchema>

export async function criarEmpresa(data: EmpresaFormData) {
  const parsed = empresaSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { cnae, ...rest } = parsed.data
  const { error } = await supabase.from("companies").insert({
    ...rest,
    cnpj: parsed.data.cnpj.replace(/\D/g, ""),
    cnae: cnae ? [cnae] : [],
    user_id: user.id,
  })

  if (error) {
    if (error.code === "23505") return { error: "CNPJ já cadastrado" }
    return { error: "Erro ao criar empresa" }
  }

  revalidatePath("/clientes")
  return { success: true }
}

export async function editarEmpresa(id: string, data: EmpresaFormData) {
  const parsed = empresaSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { cnae, ...rest } = parsed.data
  const { error } = await supabase
    .from("companies")
    .update({
      ...rest,
      cnpj: parsed.data.cnpj.replace(/\D/g, ""),
      cnae: cnae ? [cnae] : [],
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23505") return { error: "CNPJ já cadastrado" }
    return { error: "Erro ao atualizar empresa" }
  }

  revalidatePath("/clientes")
  return { success: true }
}

export async function desativarEmpresa(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("companies")
    .update({ ativo: false })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: "Erro ao desativar empresa" }

  revalidatePath("/clientes")
  return { success: true }
}

export async function ativarEmpresa(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("companies")
    .update({ ativo: true })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: "Erro ao ativar empresa" }

  revalidatePath("/clientes")
  return { success: true }
}
