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
  error?: string
}

const EMPTY_PAGINATION: Pagination = {
  total_registros: 0,
  total_paginas: 0,
  pagina_atual: 0,
  itens_nesta_pagina: 0,
}

// Leituras sempre do Supabase — a API externa só alimenta o banco via cron
export async function fetchLicitacoes({
  dataInicio,
  dataFim,
  pagina = 0,
}: {
  dataInicio: string
  dataFim: string
  pagina?: number
  uf?: string
  modalidades?: string[]
}): Promise<FetchResult> {
  try {
    const supabase = await createClient()
    const pageSize = 20
    const from = pagina * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from("licitacoes")
      .select("*", { count: "exact" })
      .eq("status", "ativa")
      .order("created_at", { ascending: false })

    // Filtro por intervalo de datas (baseado em data_abertura)
    if (dataInicio) query = query.gte("data_abertura", dataInicio)
    if (dataFim) query = query.lte("data_abertura", dataFim)

    const { data, error, count } = await query.range(from, to)

    if (error || !data) {
      return { licitacoes: [], pagination: EMPTY_PAGINATION, error: "Erro ao buscar licitações." }
    }

    const total = count ?? 0
    const licitacoes: Licitacao[] = data.map((row) => ({
      idLicitacao: parseInt(row.source_id ?? "0", 10) || 0,
      orgao: row.orgao ?? "",
      unidadeGestora: row.municipio ?? "",
      objeto: row.objeto ?? "",
      objetoSemTags: row.objeto ?? "",
      modalidade: row.modalidade ?? "",
      uf: row.uf ?? "",
      portal: row.portal ?? "PNCP",
      processo: row.source_id ?? "",
      valorTotalEstimado: row.valor_estimado ?? 0,
      dataPublicacao: row.created_at ?? "",
      dataInicialProposta: row.data_abertura ?? "",
      dataFinalProposta: row.data_encerramento ?? "",
      dataCaptura: row.created_at ?? "",
      url: row.source_url ?? "",
      cnpj: "",
      uasg: 0,
      palavraEncontrada: [],
      rankingCapag: "",
      srp: 0,
      srpDescricao: row.status ?? "",
      naLixeira: false,
      favorito: false,
      perfilNome: "",
      anexos: [],
    }))

    return {
      licitacoes,
      pagination: {
        total_registros: total,
        total_paginas: Math.ceil(total / pageSize),
        pagina_atual: pagina,
        itens_nesta_pagina: licitacoes.length,
      },
    }
  } catch {
    return { licitacoes: [], pagination: EMPTY_PAGINATION, error: "Erro ao buscar licitações." }
  }
}

export async function salvarLicitacao(lic: Licitacao) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("licitacoes").upsert(
    {
      source_id: lic.processo || String(lic.idLicitacao),
      orgao: lic.orgao,
      objeto: lic.objetoSemTags,
      valor_estimado: lic.valorTotalEstimado || null,
      modalidade: lic.modalidade,
      uf: lic.uf,
      municipio: lic.unidadeGestora || null,
      data_abertura: lic.dataInicialProposta || null,
      data_encerramento: lic.dataFinalProposta || null,
      source_url: lic.url,
      status: "ativa",
    },
    { onConflict: "source_id" }
  )

  if (error) return { error: "Erro ao salvar: " + error.message }
  revalidatePath("/licitacoes")
  return { success: true }
}
