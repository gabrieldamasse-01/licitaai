"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import Anthropic from "@anthropic-ai/sdk"
import { getModel, getMaxTokens } from "@/lib/ai-model"

export type Licitacao = {
  dbId: string          // UUID do banco (para link /licitacoes/[id])
  idLicitacao: number
  orgao: string
  unidadeGestora: string
  objeto: string
  objetoSemTags: string
  modalidade: string
  uf: string
  portal: string
  processo: string
  valorTotalEstimado: number
  dataPublicacao: string
  dataInicialProposta: string
  dataFinalProposta: string
  dataCaptura: string
  url: string
  cnpj: string
  uasg: number
  palavraEncontrada: string[]
  rankingCapag: string
  srp: number
  srpDescricao: string
  naLixeira: boolean
  favorito: boolean
  perfilNome: string
  anexos: { nome: string; url: string }[]
}

export type Pagination = {
  total_registros: number
  total_paginas: number
  pagina_atual: number
  itens_nesta_pagina: number
}

export type FetchResult = {
  licitacoes: Licitacao[]
  pagination: Pagination
  total_banco: number
  error?: string
}

const PAGE_SIZE = 50

const EMPTY_PAGINATION: Pagination = {
  total_registros: 0,
  total_paginas: 0,
  pagina_atual: 0,
  itens_nesta_pagina: 0,
}

// Leituras do Supabase — a API externa só alimenta o banco via cron
export async function fetchLicitacoes({
  pagina = 0,
  dataInicio,
  dataFim,
  uf,
  modalidades,
  busca,
  valorMin,
  valorMax,
  portal,
  status,
}: {
  pagina?: number
  dataInicio?: string
  dataFim?: string
  uf?: string
  modalidades?: string[]
  busca?: string
  valorMin?: number
  valorMax?: number
  portal?: string
  status?: string
}): Promise<FetchResult> {
  try {
    const supabase = await createClient()
    const from = pagina * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Total no banco (badge — service role, sem RLS, considera filtro de status)
    const serviceClient = createServiceClient()
    let totalBancoQuery = serviceClient
      .from("licitacoes")
      .select("id", { count: "exact", head: true })
    if (!status || status !== "todas") {
      totalBancoQuery = totalBancoQuery.eq("status", "ativa")
    }
    const { count: totalBanco } = await totalBancoQuery

    // Query principal com filtros server-side
    let query = supabase
      .from("licitacoes")
      .select("*", { count: "exact" })
      .order("data_publicacao", { ascending: false })

    if (!status || status !== "todas") {
      query = query.eq("status", "ativa")
    }

    if (dataInicio) query = query.gte("data_publicacao", dataInicio)
    if (dataFim)    query = query.lte("data_publicacao", dataFim)
    if (uf)         query = query.eq("uf", uf)
    if (modalidades && modalidades.length > 0) query = query.in("modalidade", modalidades)
    if (busca && busca.trim()) query = query.ilike("objeto", `%${busca.trim()}%`)
    if (valorMin)   query = query.gte("valor_estimado", valorMin)
    if (valorMax)   query = query.lte("valor_estimado", valorMax)
    if (portal && portal !== "todos") query = query.ilike("portal", `%${portal}%`)

    const { data, error, count } = await query.range(from, to)

    if (error || !data) {
      return { licitacoes: [], pagination: EMPTY_PAGINATION, total_banco: totalBanco ?? 0, error: "Erro ao buscar licitações." }
    }

    const total = count ?? 0
    const licitacoes: Licitacao[] = data.map((row) => ({
      dbId:               row.id ?? "",
      idLicitacao:        parseInt(row.source_id ?? "0", 10) || 0,
      orgao:              row.orgao ?? "",
      unidadeGestora:     "",
      objeto:             row.objeto ?? "",
      objetoSemTags:      row.objeto ?? "",
      modalidade:         row.modalidade ?? "",
      uf:                 row.uf ?? "",
      portal:             row.portal ?? "PNCP",
      processo:           row.source_id ?? "",
      valorTotalEstimado: row.valor_estimado ?? 0,
      dataPublicacao:     row.data_publicacao ?? row.created_at ?? "",
      dataInicialProposta: row.data_abertura ?? "",
      dataFinalProposta:  row.data_encerramento ?? "",
      dataCaptura:        row.created_at ?? "",
      url:                row.source_url ?? "",
      cnpj:               "",
      uasg:               0,
      palavraEncontrada:  [],
      rankingCapag:       "",
      srp:                0,
      srpDescricao:       "",
      naLixeira:          false,
      favorito:           false,
      perfilNome:         "",
      anexos:             [],
    }))

    return {
      licitacoes,
      total_banco: totalBanco ?? 0,
      pagination: {
        total_registros:     total,
        total_paginas:       Math.ceil(total / PAGE_SIZE),
        pagina_atual:        pagina,
        itens_nesta_pagina:  licitacoes.length,
      },
    }
  } catch {
    return { licitacoes: [], pagination: EMPTY_PAGINATION, total_banco: 0, error: "Erro ao buscar licitações." }
  }
}

export async function salvarLicitacao(lic: Licitacao) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("licitacoes").upsert(
    {
      source_id:         lic.processo || String(lic.idLicitacao),
      orgao:             lic.orgao,
      objeto:            lic.objetoSemTags,
      valor_estimado:    lic.valorTotalEstimado || null,
      modalidade:        lic.modalidade,
      uf:                lic.uf,
      data_abertura:     lic.dataInicialProposta || null,
      data_encerramento: lic.dataFinalProposta || null,
      source_url:        lic.url,
      status:            "ativa",
    },
    { onConflict: "source_id" }
  )

  if (error) return { error: "Erro ao salvar: " + error.message }
  revalidatePath("/licitacoes")
  return { success: true }
}

export type AnalisarEditalResult =
  | { analise: string; fromCache: boolean; error?: never }
  | { error: string; analise?: never; fromCache?: never }

export async function analisarEdital(
  licitacaoId: string
): Promise<AnalisarEditalResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  // Buscar dados da licitação
  const { data: lic } = await supabase
    .from("licitacoes")
    .select("objeto, orgao, modalidade, valor_estimado")
    .eq("id", licitacaoId)
    .single()

  if (!lic) return { error: "Licitação não encontrada" }

  // Verificar cache (menos de 7 dias)
  const serviceClient = createServiceClient()
  const { data: cached } = await serviceClient
    .from("licitacoes_analise_ia")
    .select("analise, created_at")
    .eq("licitacao_id", licitacaoId)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.created_at).getTime()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (age < sevenDays) {
      return { analise: cached.analise, fromCache: true }
    }
  }

  // Chamar Claude API
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const valorFormatado = lic.valor_estimado
    ? lic.valor_estimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "Não informado"

  const prompt = `Você é um especialista em licitações públicas brasileiras. Analise esta licitação e forneça: 1) Resumo executivo (3 linhas), 2) Principais requisitos de habilitação, 3) Pontos de atenção, 4) Recomendação (Participar/Avaliar/Evitar) com justificativa. Licitação: ${lic.objeto} - Órgão: ${lic.orgao} - Modalidade: ${lic.modalidade} - Valor: ${valorFormatado}`

  let analise: string
  try {
    const response = await anthropic.messages.create({
      model: getModel("analise_licitacao"),
      max_tokens: getMaxTokens("analise_media"),
      messages: [{ role: "user", content: prompt }],
    })
    const block = response.content[0]
    if (block.type !== "text") return { error: "Resposta inesperada da IA" }
    analise = block.text
  } catch {
    return { error: "Erro ao chamar a API de IA. Tente novamente." }
  }

  // Salvar no cache (upsert)
  await serviceClient
    .from("licitacoes_analise_ia")
    .upsert(
      { licitacao_id: licitacaoId, analise, created_at: new Date().toISOString() },
      { onConflict: "licitacao_id" }
    )

  return { analise, fromCache: false }
}

export async function salvarMatchDetalhe(
  licitacaoId: string,
  empresaId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id")
    .eq("id", empresaId)
    .eq("user_id", user.id)
    .single()

  if (!empresa) return { error: "Empresa não autorizada" }

  const { error: matchError } = await supabase.from("matches").upsert(
    {
      company_id: empresaId,
      licitacao_id: licitacaoId,
      relevancia_score: 0,
      status: "pendente",
    },
    { onConflict: "company_id,licitacao_id" }
  )

  if (matchError) return { error: "Erro ao salvar: " + matchError.message }

  revalidatePath(`/licitacoes/${licitacaoId}`)
  return { success: true }
}
