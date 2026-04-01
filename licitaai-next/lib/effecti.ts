const BASE_URL = "https://mdw.minha.effecti.com.br/api-integracao/v1"

// Raw shape retornado pela API Effecti — campos alternativos por versão
type EffectiAviso = {
  id?: number | string
  numeroAviso?: string
  numeroCompra?: string
  orgao?: string
  uf?: string
  estado?: string
  municipio?: string
  cidade?: string
  modalidade?: string
  objeto?: string
  descricao?: string
  valorEstimado?: number
  valor?: number
  dataAbertura?: string
  abertura?: string
  dataPublicacao?: string
  publicacao?: string
  urlOriginal?: string
  url?: string
  portalOrigem?: string
  status?: string
  situacao?: string
  naLixeira?: boolean
}

type EffectiPage = {
  content?: EffectiAviso[]
  avisos?: EffectiAviso[]
  licitacoes?: EffectiAviso[]
  totalElements?: number
  totalPages?: number
  number?: number // página atual 0-based
  size?: number
}

export type EffectiParams = {
  dataInicio: string // "YYYY-MM-DD"
  dataFim: string // "YYYY-MM-DD"
  pagina?: number
  estados?: string[]
  palavrasChave?: string[]
  modalidades?: string[]
  valorMinimo?: number
  valorMaximo?: number
}

// Forma normalizada — compatível com o tipo Licitacao do actions.ts
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

function normalize(aviso: EffectiAviso): NormalizedLicitacao {
  const rawId = aviso.id ?? aviso.numeroAviso ?? aviso.numeroCompra ?? 0
  const idLicitacao =
    typeof rawId === "number" ? rawId : parseInt(String(rawId), 10) || 0

  return {
    idLicitacao,
    orgao: aviso.orgao ?? "",
    unidadeGestora: aviso.municipio ?? aviso.cidade ?? "",
    objeto: aviso.objeto ?? aviso.descricao ?? "",
    objetoSemTags: aviso.objeto ?? aviso.descricao ?? "",
    modalidade: aviso.modalidade ?? "",
    uf: aviso.uf ?? aviso.estado ?? "",
    portal: aviso.portalOrigem ?? "Effecti",
    processo: aviso.numeroCompra ?? aviso.numeroAviso ?? "",
    valorTotalEstimado: aviso.valorEstimado ?? aviso.valor ?? 0,
    dataPublicacao: aviso.dataPublicacao ?? aviso.publicacao ?? "",
    dataInicialProposta: aviso.dataAbertura ?? aviso.abertura ?? "",
    dataFinalProposta: aviso.dataAbertura ?? aviso.abertura ?? "",
    dataCaptura: new Date().toISOString(),
    url: aviso.urlOriginal ?? aviso.url ?? "",
    cnpj: "",
    uasg: 0,
    palavraEncontrada: [],
    rankingCapag: "",
    srp: 0,
    srpDescricao: aviso.status ?? aviso.situacao ?? "",
    naLixeira: aviso.naLixeira ?? false,
    favorito: false,
    perfilNome: "",
    anexos: [],
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
    const body: Record<string, unknown> = {
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
    }
    if (params.estados?.length) body.estados = params.estados
    if (params.palavrasChave?.length) body.palavrasChave = params.palavrasChave
    if (params.modalidades?.length) body.modalidades = params.modalidades
    if (params.valorMinimo !== undefined) body.valorMinimo = params.valorMinimo
    if (params.valorMaximo !== undefined) body.valorMaximo = params.valorMaximo

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeout)

    if (!res.ok) {
      return {
        licitacoes: [],
        pagination: EMPTY_PAGINATION,
        error: `Effecti API retornou ${res.status}`,
      }
    }

    const data: EffectiPage = await res.json()
    const avisos = data.content ?? data.avisos ?? data.licitacoes ?? []
    const licitacoes = avisos.filter((a) => !a.naLixeira).map(normalize)

    const pagination: NormalizedPagination = {
      total_registros: data.totalElements ?? licitacoes.length,
      total_paginas: data.totalPages ?? 1,
      pagina_atual: data.number ?? 0,
      itens_nesta_pagina: data.size ?? licitacoes.length,
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
