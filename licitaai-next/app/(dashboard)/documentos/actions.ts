"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const documentoSchema = z.object({
  company_id: z.string().uuid("Empresa inválida"),
  document_type_id: z.string().uuid("Tipo de documento inválido"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  nome_arquivo: z.string().min(1, "Nome do arquivo é obrigatório"),
  data_emissao: z.string().optional(),
  data_validade: z.string().optional(),
  arquivo_url: z.string().optional(),
})

export type DocumentoFormData = z.infer<typeof documentoSchema>

function calcularStatus(data_validade?: string): "ativo" | "vencido" | "pendente" {
  if (!data_validade) return "pendente"
  const validade = new Date(data_validade + "T00:00:00")
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (validade < hoje) return "vencido"
  return "ativo"
}

export async function criarDocumento(data: DocumentoFormData) {
  const parsed = documentoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { company_id, document_type_id, tipo, nome_arquivo, data_emissao, data_validade, arquivo_url } = parsed.data

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", company_id)
    .eq("user_id", user.id)
    .single()

  if (!company) return { error: "Empresa não encontrada" }

  const status = calcularStatus(data_validade)

  const { error } = await supabase.from("documents").insert({
    company_id,
    document_type_id,
    tipo,
    nome_arquivo,
    data_emissao: data_emissao || null,
    data_validade: data_validade || null,
    status,
    arquivo_url: arquivo_url || null,
  })

  if (error) return { error: "Erro ao criar documento" }

  revalidatePath("/documentos")
  return { success: true }
}

export async function getSignedUrl(path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  // Verifica que o path pertence ao usuário (começa com user_id/)
  if (!path.startsWith(user.id + "/")) return { error: "Acesso negado" }

  const service = createServiceClient()
  const { data, error } = await service.storage
    .from("documentos")
    .createSignedUrl(path, 3600)

  if (error) return { error: "Erro ao gerar link do arquivo" }
  return { url: data.signedUrl }
}

export async function atualizarStatusVencidos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  // Busca apenas as empresas do usuário autenticado
  const { data: companies } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)

  if (!companies || companies.length === 0) return { success: true }

  const companyIds = companies.map((c) => c.id)
  const hoje = new Date().toISOString().split("T")[0]

  const { error } = await supabase
    .from("documents")
    .update({ status: "vencido" })
    .in("company_id", companyIds)
    .lt("data_validade", hoje)
    .eq("status", "ativo")

  if (error) return { error: "Erro ao atualizar status" }

  revalidatePath("/documentos")
  return { success: true }
}
