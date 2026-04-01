"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const PROXY_URL = "https://effecti-dashboard.onrender.com/api/licitacoes/page"

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

// Fallback: lê licitações salvas no Supabase
async function fetchFromSupabase(pagina: number): Promise<FetchResult> {
  try {
    const supabase = await createClient()
    const pageSize = 20
    const from = pagina * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from("licitacoes")
      .select("*", { count: "exact" })
      .eq("status", "ativa")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error || !data) {
      return { licitacoes: [], pagination: EMPTY_PAGINATION, error: "Erro ao buscar no Supabase." }
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
      portal: "Supabase",
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
    return { licitacoes: [], pagination: EMPTY_PAGINATION, error: "Erro ao buscar no Supabase." }
  }
}

export async function fetchLicitacoes({
  dataInicio,
  dataFim,
  pagina = 0,
  uf,
  pesquisa,
}: {
  dataInicio: string
  dataFim: string
  pagina?: number
  uf?: string
  pesquisa?: string
}): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const body: Record<string, unknown> = {
      begin: dataInicio,
      end: dataFim,
      page: pagina,
    }
    if (uf) body.uf = uf
    if (pesquisa?.trim()) body.pesquisa = pesquisa.trim()

    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const fallback = await fetchFromSupabase(pagina)
      return fallback.error
        ? { licitacoes: [], pagination: EMPTY_PAGINATION, error: `Proxy retornou ${res.status}` }
        : fallback
    }

    const data = await res.json()
    const licitacoes: Licitacao[] = (data.licitacoes ?? []).filter(
      (l: Licitacao) => !l.naLixeira
    )

    if (licitacoes.length === 0) {
      // Proxy respondeu OK mas sem dados — usa Supabase como complemento
      const fallback = await fetchFromSupabase(pagina)
      if (!fallback.error && fallback.licitacoes.length > 0) return fallback
    }

    return {
      licitacoes,
      pagination: data.pagination ?? EMPTY_PAGINATION,
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    const isAbort = err instanceof Error && err.name === "AbortError"
    const error = isAbort
      ? "Tempo esgotado. O servidor pode estar iniciando — aguarde e tente novamente."
      : "Erro de conexão com a API de licitações."

    const fallback = await fetchFromSupabase(pagina)
    return fallback.error ? { licitacoes: [], pagination: EMPTY_PAGINATION, error } : fallback
  }
}

function parseBrDate(dateStr: string): string | null {
  if (!dateStr) return null
  const [datePart, timePart] = dateStr.split(" ")
  const parts = datePart.split("/")
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  return `${year}-${month}-${day}T${timePart ?? "00:00:00"}`
}

export async function salvarLicitacao(lic: Licitacao) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("licitacoes").upsert(
    {
      source_id: String(lic.idLicitacao),
      orgao: lic.orgao,
      objeto: lic.objetoSemTags,
      valor_estimado: lic.valorTotalEstimado || null,
      modalidade: lic.modalidade,
      uf: lic.uf,
      municipio: lic.unidadeGestora || null,
      data_abertura: parseBrDate(lic.dataInicialProposta),
      data_encerramento: parseBrDate(lic.dataFinalProposta),
      source_url: lic.url,
      status: "ativa",
    },
    { onConflict: "source_id" }
  )

  if (error) return { error: "Erro ao salvar: " + error.message }
  revalidatePath("/licitacoes")
  return { success: true }
}
