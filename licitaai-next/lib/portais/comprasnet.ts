// lib/portais/comprasnet.ts
// Integração ComprasNet (Compras.gov.br / SIASG) via API PNCP
// A API compras.dados.gov.br foi descontinuada — PNCP é o substituto oficial
// Filtro: poderId "F" (Federal) identifica licitações do SIASG/ComprasNet

const PNCP_BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"
const TAMANHO_PAGINA = 50
const MAX_PAGINAS = 20

// Modalidades cobertas pelo SIASG/ComprasNet
const MODALIDADES = [6, 8, 9, 4, 5, 12]

type PncpItem = {
  numeroControlePNCP: string
  orgaoEntidade: {
    cnpj?: string
    razaoSocial?: string
    poderId?: string
    esferaId?: string
  }
  unidadeOrgao: {
    ufSigla?: string
    municipioNome?: string
    nomeUnidade?: string
    codigoUnidade?: string
  }
  objetoCompra?: string
  modalidadeNome?: string
  valorTotalEstimado?: number
  dataPublicacaoPncp?: string
  dataAberturaProposta?: string
  dataEncerramentoProposta?: string
  linkSistemaOrigem?: string
  processo?: string
  anoCompra: number
  sequencialCompra: number
}

type PncpPage = {
  data?: PncpItem[]
  totalRegistros?: number
  totalPaginas?: number
}

export type ComprasNetLicitacao = {
  source_id: string
  portal: string
  orgao: string | null
  objeto: string | null
  valor_estimado: number | null
  modalidade: string | null
  uf: string | null
  municipio: string | null
  data_publicacao: string | null
  data_abertura: string | null
  data_encerramento: string | null
  source_url: string
  numero_processo: string | null
  status: string
  updated_at: string
}

export type FetchComprasNetResult = {
  licitacoes: ComprasNetLicitacao[]
  total: number
  erros: string[]
}

function toApiDate(d: string): string {
  return d.replace(/-/g, "")
}

function safeDate(val: string | undefined | null): string | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function buildUrl(item: PncpItem): string {
  if (item.linkSistemaOrigem) return item.linkSistemaOrigem
  const cnpj = item.orgaoEntidade?.cnpj ?? ""
  return `https://pncp.gov.br/app/editais/${cnpj}/${item.anoCompra}/${String(item.sequencialCompra).padStart(7, "0")}`
}

async function fetchPagina(
  dataInicial: string,
  dataFinal: string,
  codigoModalidade: number,
  pagina: number,
  signal: AbortSignal,
): Promise<PncpPage> {
  const url = new URL(PNCP_BASE)
  url.searchParams.set("dataInicial", dataInicial)
  url.searchParams.set("dataFinal", dataFinal)
  url.searchParams.set("pagina", String(pagina))
  url.searchParams.set("tamanhoPagina", String(TAMANHO_PAGINA))
  url.searchParams.set("codigoModalidadeContratacao", String(codigoModalidade))

  const res = await fetch(url.toString(), { signal, cache: "no-store" })
  if (res.status === 404 || res.status === 204) return {}
  if (!res.ok) return {}
  return res.json() as Promise<PncpPage>
}

function mapToRow(item: PncpItem, agora: Date): ComprasNetLicitacao {
  return {
    source_id:         `comprasnet-${item.numeroControlePNCP}`,
    portal:            "ComprasNet",
    orgao:             item.orgaoEntidade?.razaoSocial ?? null,
    objeto:            item.objetoCompra ?? null,
    modalidade:        item.modalidadeNome ?? null,
    uf:                item.unidadeOrgao?.ufSigla ?? null,
    municipio:         item.unidadeOrgao?.municipioNome ?? null,
    valor_estimado:    item.valorTotalEstimado ?? null,
    data_publicacao:   safeDate(item.dataPublicacaoPncp),
    data_abertura:     safeDate(item.dataAberturaProposta),
    data_encerramento: safeDate(item.dataEncerramentoProposta),
    source_url:        buildUrl(item),
    numero_processo:   item.processo ?? null,
    status:            "ativa",
    updated_at:        agora.toISOString(),
  }
}

// Filtra apenas licitações de órgãos federais (poderId "F")
function isFederal(item: PncpItem): boolean {
  return item.orgaoEntidade?.poderId === "F"
}

async function processarModalidade(
  dataInicial: string,
  dataFinal: string,
  codigoModalidade: number,
  agora: Date,
): Promise<{ licitacoes: ComprasNetLicitacao[]; erros: string[] }> {
  let pagina = 1
  let totalPaginas = 1
  const licitacoes: ComprasNetLicitacao[] = []
  const erros: string[] = []

  while (pagina <= totalPaginas && pagina <= MAX_PAGINAS) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50000)

    let page: PncpPage
    try {
      page = await fetchPagina(dataInicial, dataFinal, codigoModalidade, pagina, controller.signal)
    } catch (err) {
      clearTimeout(timeout)
      const msg = err instanceof Error ? err.message : String(err)
      erros.push(`comprasnet mod=${codigoModalidade} pag=${pagina}: ${msg}`)
      break
    }
    clearTimeout(timeout)

    if (!page.data || page.data.length === 0) break

    if (pagina === 1) {
      totalPaginas = Math.min(page.totalPaginas ?? 1, MAX_PAGINAS)
    }

    // Filtra apenas federais
    const federais = page.data.filter(isFederal)
    for (const item of federais) {
      licitacoes.push(mapToRow(item, agora))
    }

    pagina++
  }

  return { licitacoes, erros }
}

export async function fetchComprasNet(
  begin: string,
  end: string,
): Promise<FetchComprasNetResult> {
  const agora = new Date()
  const dataInicial = toApiDate(begin)
  const dataFinal = toApiDate(end)

  const resultados = await Promise.all(
    MODALIDADES.map((m) => processarModalidade(dataInicial, dataFinal, m, agora)),
  )

  const todasLicitacoes = resultados.flatMap((r) => r.licitacoes)
  const todosErros = resultados.flatMap((r) => r.erros)

  // Deduplica por source_id
  const seen = new Set<string>()
  const deduped = todasLicitacoes.filter((l) => {
    if (seen.has(l.source_id)) return false
    seen.add(l.source_id)
    return true
  })

  return {
    licitacoes: deduped,
    total: deduped.length,
    erros: todosErros,
  }
}
