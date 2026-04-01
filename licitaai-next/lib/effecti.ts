const BASE_URL = "https://mdw.minha.effecti.com.br/api-integracao/v1"

// Shape real retornado pela API Effecti (confirmado via teste direto)
type EffectiLicitacao = {
  idLicitacao: number
  orgao: string
  unidadeGestora?: string
  objeto: string
  objetoSemTags?: string
  modalidade: string
  uf: string
  portal: string
  processo: string
  valorTotalEstimado: number
  dataPublicacao: string
  dataInicialProposta?: string
  dataFinalProposta?: string
  dataCaptura: string
  url: string
  cnpj?: string
  uasg?: number
  palavraEncontrada?: string[]
  rankingCapag?: string
  srp?: number
  srpDescricao?: string
  naLixeira?: boolean
  favorito?: boolean
  perfilNome?: string
  perfil?: number
  anexos?: { nome: string; url: string }[]
}

type EffectiMetadata = {
  pagina_atual: number
  total_paginas: number
  total_registros: number
}

type EffectiPage = {
  _metadata: EffectiMetadata
  licitacoes: EffectiLicitacao[]
}

export type EffectiParams = {
  begin: string        // ISO 8601: "2026-03-28T00:00:00" — janela máxima: 5 dias
  end: string          // ISO 8601: "2026-04-01T23:59:59"
  pagina?: number
  palavrasChave?: string[]  // keywords para filtrar na origem
}

// Shape normalizado — compatível com o tipo Licitacao do actions.ts
export type NormalizedLicitacao = {
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

export type NormalizedPagination = {
  total_registros: number
  total_paginas: number
  pagina_atual: number
  itens_nesta_pagina: number
}

export type EffectiResult = {
  licitacoes: NormalizedLicitacao[]
  pagination: NormalizedPagination
  error?: string
}

const EMPTY_PAGINATION: NormalizedPagination = {
  total_registros: 0,
  total_paginas: 0,
  pagina_atual: 0,
  itens_nesta_pagina: 0,
}

function normalize(lic: EffectiLicitacao): NormalizedLicitacao {
  return {
    idLicitacao: lic.idLicitacao,
    orgao: lic.orgao ?? "",
    unidadeGestora: lic.unidadeGestora ?? "",
    objeto: lic.objeto ?? "",
    objetoSemTags: lic.objetoSemTags ?? lic.objeto ?? "",
    modalidade: lic.modalidade ?? "",
    uf: lic.uf ?? "",
    portal: lic.portal ?? "Effecti",
    processo: lic.processo ?? "",
    valorTotalEstimado: lic.valorTotalEstimado ?? 0,
    dataPublicacao: lic.dataPublicacao ?? "",
    dataInicialProposta: lic.dataInicialProposta ?? "",
    dataFinalProposta: lic.dataFinalProposta ?? "",
    dataCaptura: lic.dataCaptura ?? new Date().toISOString(),
    url: lic.url ?? "",
    cnpj: lic.cnpj ?? "",
    uasg: lic.uasg ?? 0,
    palavraEncontrada: lic.palavraEncontrada ?? [],
    rankingCapag: lic.rankingCapag ?? "",
    srp: lic.srp ?? 0,
    srpDescricao: lic.srpDescricao ?? "",
    naLixeira: lic.naLixeira ?? false,
    favorito: lic.favorito ?? false,
    perfilNome: lic.perfilNome ?? "",
    anexos: lic.anexos ?? [],
  }
}

export async function fetchEffectiLicitacoes(
  params: EffectiParams
): Promise<EffectiResult> {
  const token = process.env.EFFECTI_API_TOKEN
  if (!token) {
    return {
      licitacoes: [],
      pagination: EMPTY_PAGINATION,
      error: "EFFECTI_API_TOKEN não configurado",
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const url = `${BASE_URL}/aviso/licitacao?page=${params.pagina ?? 0}`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,  // sem "Bearer" — API requer token direto
      },
      body: JSON.stringify({
        begin: params.begin,
        end: params.end,
        ...(params.palavrasChave && params.palavrasChave.length > 0
          ? { palavrasChave: params.palavrasChave }
          : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return {
        licitacoes: [],
        pagination: EMPTY_PAGINATION,
        error: `Effecti API retornou ${res.status}: ${text}`,
      }
    }

    const data: EffectiPage = await res.json()
    const licitacoes = (data.licitacoes ?? [])
      .filter((l) => !l.naLixeira)
      .map(normalize)

    const pagination: NormalizedPagination = {
      total_registros: data._metadata?.total_registros ?? licitacoes.length,
      total_paginas: data._metadata?.total_paginas ?? 1,
      pagina_atual: data._metadata?.pagina_atual ?? 0,
      itens_nesta_pagina: licitacoes.length,
    }

    return { licitacoes, pagination }
  } catch (err: unknown) {
    clearTimeout(timeout)
    const isAbort = err instanceof Error && err.name === "AbortError"
    return {
      licitacoes: [],
      pagination: EMPTY_PAGINATION,
      error: isAbort
        ? "Tempo esgotado ao conectar com a API Effecti."
        : "Erro de conexão com a API Effecti.",
    }
  }
}
