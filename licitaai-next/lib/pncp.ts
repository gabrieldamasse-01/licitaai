const BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"

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

// codigoModalidadeContratacao é obrigatório na API do PNCP
const MODALIDADES_PADRAO = [
  { codigo: 6, nome: "Pregão - Eletrônico" },
  { codigo: 8, nome: "Dispensa de Licitação" },
  { codigo: 9, nome: "Inexigibilidade" },
  { codigo: 4, nome: "Concorrência - Eletrônica" },
  { codigo: 5, nome: "Concorrência - Presencial" },
  { codigo: 12, nome: "Credenciamento" },
]

// Mapa de nome de exibição → código PNCP (para filtrar por modalidade)
export const PNCP_MODALIDADE_MAP: Record<string, number> = {
  "Pregão Eletrônico": 6,
  "Dispensa": 8,
  "Inexigibilidade": 9,
  "Concorrência": 4,
  "Credenciamento": 12,
}

// Converte YYYY-MM-DD → yyyyMMdd
function toApiDate(d: string): string {
  return d.replace(/-/g, "")
}

// Gera id numérico estável a partir do numeroControlePNCP
function controlToId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

// Constrói URL pública do edital no PNCP
function buildUrl(item: PncpItem): string {
  if (item.linkSistemaOrigem) return item.linkSistemaOrigem
  const cnpj = item.orgaoEntidade?.cnpj ?? ""
  return `https://pncp.gov.br/app/editais/${cnpj}/${item.anoCompra}/${String(item.sequencialCompra).padStart(7, "0")}`
}

type PncpItem = {
  numeroControlePNCP: string
  orgaoEntidade: { cnpj?: string; razaoSocial?: string }
  unidadeOrgao: { ufSigla?: string; municipioNome?: string; nomeUnidade?: string }
  objetoCompra?: string
  modalidadeNome?: string
  valorTotalEstimado?: number
  dataPublicacaoPncp?: string
  dataAberturaProposta?: string
  dataEncerramentoProposta?: string
  linkSistemaOrigem?: string
  processo?: string
  srp?: boolean
  situacaoCompraNome?: string
  anoCompra: number
  sequencialCompra: number
}

type PncpPage = {
  data?: PncpItem[]
  totalRegistros?: number
  totalPaginas?: number
}

const EMPTY_PAGINATION: Pagination = {
  total_registros: 0,
  total_paginas: 0,
  pagina_atual: 0,
  itens_nesta_pagina: 0,
}

async function fetchModalidade(
  params: { dataInicial: string; dataFinal: string; pagina: number; uf?: string },
  codigoModalidade: number,
  signal: AbortSignal
): Promise<PncpPage> {
  const url = new URL(BASE)
  url.searchParams.set("dataInicial", params.dataInicial)
  url.searchParams.set("dataFinal", params.dataFinal)
  url.searchParams.set("pagina", String(params.pagina))
  url.searchParams.set("tamanhoPagina", "10")
  url.searchParams.set("codigoModalidadeContratacao", String(codigoModalidade))
  if (params.uf) url.searchParams.set("uf", params.uf)

  const res = await fetch(url.toString(), { signal, cache: "no-store" })
  if (!res.ok) return {}
  return res.json()
}

function normalize(item: PncpItem): Licitacao {
  return {
    idLicitacao: controlToId(item.numeroControlePNCP),
    orgao: item.orgaoEntidade?.razaoSocial ?? "",
    unidadeGestora: item.unidadeOrgao?.nomeUnidade ?? "",
    objeto: item.objetoCompra ?? "",
    objetoSemTags: item.objetoCompra ?? "",
    modalidade: item.modalidadeNome ?? "",
    uf: item.unidadeOrgao?.ufSigla ?? "",
    portal: "PNCP",
    processo: item.processo ?? item.numeroControlePNCP,
    valorTotalEstimado: item.valorTotalEstimado ?? 0,
    dataPublicacao: item.dataPublicacaoPncp ?? "",
    dataInicialProposta: item.dataAberturaProposta ?? "",
    dataFinalProposta: item.dataEncerramentoProposta ?? "",
    dataCaptura: new Date().toISOString(),
    url: buildUrl(item),
    cnpj: item.orgaoEntidade?.cnpj ?? "",
    uasg: 0,
    palavraEncontrada: [],
    rankingCapag: "",
    srp: item.srp ? 1 : 0,
    srpDescricao: item.situacaoCompraNome ?? "",
    naLixeira: false,
    favorito: false,
    perfilNome: "",
    anexos: [],
  }
}

export async function fetchLicitacoesPNCP({
  dataInicio,
  dataFim,
  pagina = 0,
  uf,
  modalidadeCodigos,
}: {
  dataInicio: string
  dataFim: string
  pagina?: number
  uf?: string
  modalidadeCodigos?: number[]
}): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const apiParams = {
      dataInicial: toApiDate(dataInicio),
      dataFinal: toApiDate(dataFim),
      pagina: pagina + 1, // PNCP usa 1-based
      uf,
    }

    const codigos = modalidadeCodigos?.length
      ? modalidadeCodigos
      : MODALIDADES_PADRAO.map((m) => m.codigo)

    const pages = await Promise.all(
      codigos.map((codigo) => fetchModalidade(apiParams, codigo, controller.signal))
    )

    clearTimeout(timeout)

    // Combina resultados de todas as modalidades
    const allItems: PncpItem[] = pages.flatMap((p) => p.data ?? [])

    // Deduplica por numeroControlePNCP (pode haver sobreposição)
    const seen = new Set<string>()
    const unique = allItems.filter((item) => {
      if (seen.has(item.numeroControlePNCP)) return false
      seen.add(item.numeroControlePNCP)
      return true
    })

    const licitacoes = unique.map(normalize)

    // Agrega paginação: soma de totais, máximo de páginas
    const totalRegistros = pages.reduce((s, p) => s + (p.totalRegistros ?? 0), 0)
    const totalPaginas = Math.max(...pages.map((p) => p.totalPaginas ?? 0), 1)

    return {
      licitacoes,
      pagination: {
        total_registros: totalRegistros,
        total_paginas: totalPaginas,
        pagina_atual: pagina,
        itens_nesta_pagina: licitacoes.length,
      },
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    const isAbort = err instanceof Error && err.name === "AbortError"
    return {
      licitacoes: [],
      pagination: EMPTY_PAGINATION,
      error: isAbort ? "Tempo esgotado ao consultar o PNCP." : "Erro de conexão com o PNCP.",
    }
  }
}
