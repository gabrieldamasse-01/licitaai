"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type Licitacao = {
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
}: {
  pagina?: number
  dataInicio?: string
  dataFim?: string
  uf?: string
  modalidades?: string[]
  busca?: string
}): Promise<FetchResult> {
  try {
    const supabase = await createClient()
    const from = pagina * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Total no banco sem filtros (para o badge)
    const { count: totalBanco } = await supabase
      .from("licitacoes")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativa")

    // Query principal com filtros server-side
    let query = supabase
      .from("licitacoes")
      .select("*", { count: "exact" })
      .eq("status", "ativa")
      .order("data_publicacao", { ascending: false })

    if (dataInicio) query = query.gte("data_publicacao", dataInicio)
    if (dataFim)    query = query.lte("data_publicacao", dataFim)
    if (uf)         query = query.eq("uf", uf)
    if (modalidades && modalidades.length > 0) query = query.in("modalidade", modalidades)
    if (busca && busca.trim()) query = query.ilike("objeto", `%${busca.trim()}%`)

    const { data, error, count } = await query.range(from, to)

    if (error || !data) {
      return { licitacoes: [], pagination: EMPTY_PAGINATION, total_banco: totalBanco ?? 0, error: "Erro ao buscar licitações." }
    }

    const total = count ?? 0
    const licitacoes: Licitacao[] = data.map((row) => ({
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
