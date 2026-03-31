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

export async function fetchLicitacoes({
  dataInicio,
  dataFim,
  pagina = 0,
}: {
  dataInicio: string
  dataFim: string
  pagina?: number
}): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const res = await fetch(
      "https://effecti-dashboard.onrender.com/api/licitacoes/page",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          begin: dataInicio + "T00:00:00.000Z",
          end: dataFim + "T23:59:59.999Z",
          page: pagina,
        }),
        signal: controller.signal,
        cache: "no-store",
      }
    )

    clearTimeout(timeout)

    if (!res.ok) {
      return {
        licitacoes: [],
        pagination: EMPTY_PAGINATION,
        error: `Erro ao buscar licitações (${res.status})`,
      }
    }

    const data = await res.json()
    return {
      licitacoes: (data.licitacoes ?? []).filter((l: Licitacao) => !l.naLixeira),
      pagination: data.pagination ?? EMPTY_PAGINATION,
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    const isAbort = err instanceof Error && err.name === "AbortError"
    return {
      licitacoes: [],
      pagination: EMPTY_PAGINATION,
      error: isAbort
        ? "Tempo esgotado. O servidor pode estar iniciando — aguarde e tente novamente."
        : "Erro de conexão com a API de licitações.",
    }
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
      municipio: null,
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
