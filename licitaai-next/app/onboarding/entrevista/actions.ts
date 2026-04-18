"use server"

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

async function getEntrevistaComPermissao(entrevistaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" as const, user: null }

  const { data: entrevista, error } = await supabase
    .from("entrevistas_onboarding")
    .select("id, user_id, respostas, status")
    .eq("id", entrevistaId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !entrevista) return { error: "Entrevista não encontrada" as const, user: null }

  return { error: null, user, entrevista }
}

export async function criarOuBuscarEntrevista(): Promise<
  { id: string; respostas: Record<string, unknown> } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: existente } = await supabase
    .from("entrevistas_onboarding")
    .select("id, respostas")
    .eq("user_id", user.id)
    .eq("status", "em_andamento")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existente) return { id: existente.id, respostas: existente.respostas as Record<string, unknown> }

  const { data: nova, error } = await supabase
    .from("entrevistas_onboarding")
    .insert({
      user_id: user.id,
      company_id: company?.id ?? null,
      respostas: {},
      status: "em_andamento",
    })
    .select("id, respostas")
    .single()

  if (error || !nova) return { error: "Erro ao criar entrevista" }
  return { id: nova.id, respostas: nova.respostas as Record<string, unknown> }
}

export async function salvarResposta(
  entrevistaId: string,
  perguntaId: number,
  resposta: unknown,
): Promise<{ success: true } | { error: string }> {
  const result = await getEntrevistaComPermissao(entrevistaId)
  if (result.error) return { error: result.error }

  // Usa service client para evitar expiração de cookie em chamadas sequenciais rápidas
  const serviceClient = createServiceClient()
  const respostasAtuais = (result.entrevista.respostas as Record<string, unknown>) ?? {}
  const respostasAtualizadas = { ...respostasAtuais, [String(perguntaId)]: resposta }

  const { error } = await serviceClient
    .from("entrevistas_onboarding")
    .update({ respostas: respostasAtualizadas })
    .eq("id", entrevistaId)
    .eq("user_id", result.user!.id)

  if (error) return { error: "Erro ao salvar resposta" }
  return { success: true }
}

async function gerarPerfilViaIA(respostas: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const client = new Anthropic()

    const respostasTexto = Object.entries(respostas)
      .map(([k, v]) => `Pergunta ${k}: ${JSON.stringify(v)}`)
      .join("\n")

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Você é especialista em licitações públicas brasileiras. Com base nas respostas da entrevista abaixo, extraia critérios de busca:

${respostasTexto}

Retorne APENAS um JSON puro sem markdown com os campos:
- cnaes_provaveis: array de strings com códigos CNAE (ex: ["4120-4/00", "6201-5/01"])
- palavras_chave: array de strings com termos relevantes para busca de licitações
- ufs_prioritarias: array de siglas de estados (ex: ["SP", "RJ"])
- valor_min: número em reais (null se sem mínimo)
- valor_max: número em reais (null se sem máximo)
- modalidades: array de strings com modalidades preferidas`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== "text") return null

    const texto = content.text.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "")
    return JSON.parse(texto)
  } catch {
    // IA indisponível ou chave inválida — prossegue sem perfil
    return null
  }
}

export async function concluirEntrevista(
  entrevistaId: string,
  respostas: Record<string, unknown>,
): Promise<{ success: true; perfilGerado: boolean } | { error: string }> {
  const result = await getEntrevistaComPermissao(entrevistaId)
  if (result.error) return { error: result.error }

  const perfil = await gerarPerfilViaIA(respostas)
  const serviceClient = createServiceClient()

  const { error: updateError } = await serviceClient
    .from("entrevistas_onboarding")
    .update({
      respostas,
      perfil_gerado: perfil ?? null,
      status: "concluida",
      concluida_em: new Date().toISOString(),
    })
    .eq("id", entrevistaId)
    .eq("user_id", result.user!.id)

  if (updateError) return { error: "Erro ao salvar perfil" }

  if (perfil && Object.keys(perfil).length > 0) {
    const { data: company } = await serviceClient
      .from("companies")
      .select("id")
      .eq("user_id", result.user!.id)
      .maybeSingle()

    if (company) {
      const p = perfil as {
        palavras_chave?: string[]
        ufs_prioritarias?: string[]
        valor_min?: number | null
        valor_max?: number | null
      }

      await serviceClient
        .from("companies")
        .update({
          ...(p.palavras_chave?.length && { keywords: p.palavras_chave }),
          ...(p.ufs_prioritarias?.length && { ufs_interesse: p.ufs_prioritarias }),
          ...(p.valor_min !== undefined && { valor_min: p.valor_min }),
          ...(p.valor_max !== undefined && { valor_max: p.valor_max }),
        })
        .eq("id", company.id)
    }
  }

  return { success: true, perfilGerado: perfil !== null }
}
