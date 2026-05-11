import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// Cron de sincronização PNCP → Supabase — executa 3x/dia via Vercel Cron
// Schedule: 0 7,13,19 * * * (UTC) — equivale a 4h, 10h, 16h BRT
// Janela: últimos 7 dias
// Aceita GET (Vercel Cron) e POST (chamada manual) com Authorization: Bearer <CRON_SECRET>
// Nota: API PNCP aceita tamanhoPagina entre 10 e 50

export const maxDuration = 300 // 5 min

const PNCP_BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"
const TAMANHO_PAGINA = 50  // máximo permitido pela API PNCP
const MAX_PAGINAS = 20     // 20 × 50 = 1.000 licitações por modalidade por execução

// Modalidades padrão do PNCP
const MODALIDADES = [6, 8, 9, 4, 5, 12, 1, 2, 3, 7, 10, 11] // Pregão Eletr., Dispensa, Inexig., Concorr. Eletr., Concorr. Presencial, Credenciamento, Leilão Eletr., Diálogo Comp., Concurso, Pregão Presencial, Credenciamento (outro), Concorrência Pública

type PncpItem = {
  numeroControlePNCP: string
  orgaoEntidade: { cnpj?: string; razaoSocial?: string }
  unidadeOrgao: { ufSigla?: string; ufNome?: string; municipioNome?: string; nomeUnidade?: string }
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

// Converte YYYY-MM-DD → yyyyMMdd
function toApiDate(d: string): string {
  return d.replace(/-/g, "")
}

// Converte data PNCP (ex: "2026-04-10T00:00:00") para ISO seguro
function safeDate(val: string | undefined | null): string | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// Constrói URL pública do edital
function buildUrl(item: PncpItem): string {
  if (item.linkSistemaOrigem) return item.linkSistemaOrigem
  const cnpj = item.orgaoEntidade?.cnpj ?? ""
  return `https://pncp.gov.br/app/editais/${cnpj}/${item.anoCompra}/${String(item.sequencialCompra).padStart(7, "0")}`
}

function autenticar(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth
  return token === process.env.CRON_SECRET
}

async function fetchPaginaModalidade(
  dataInicial: string,
  dataFinal: string,
  codigoModalidade: number,
  pagina: number,
  signal: AbortSignal
): Promise<PncpPage> {
  const url = new URL(PNCP_BASE)
  url.searchParams.set("dataInicial", dataInicial)
  url.searchParams.set("dataFinal", dataFinal)
  url.searchParams.set("pagina", String(pagina))
  url.searchParams.set("tamanhoPagina", String(TAMANHO_PAGINA))
  url.searchParams.set("codigoModalidadeContratacao", String(codigoModalidade))

  const res = await fetch(url.toString(), { signal, cache: "no-store" })
  if (res.status === 404 || res.status === 204) return {}
  if (!res.ok) {
    console.warn(`[cron/licitacoes-pncp] HTTP ${res.status} modalidade=${codigoModalidade} pagina=${pagina}`)
    return {}
  }
  return res.json() as Promise<PncpPage>
}

async function executar(req: NextRequest): Promise<NextResponse> {
  if (!autenticar(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const agora = new Date()

  // Janela: 7 dias para trás (equilíbrio entre cobertura e tempo de resposta da API)
  const inicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const dataInicial = toApiDate(inicio.toISOString().slice(0, 10))
  const dataFinal = toApiDate(agora.toISOString().slice(0, 10))

  let buscadas = 0
  let inseridas = 0
  let ignoradas = 0
  const erros: string[] = []

  console.log(`[cron/licitacoes-pncp] Iniciando — janela: ${dataInicial} → ${dataFinal}`)

  // ─── Função que processa uma modalidade completa (todas as páginas) ──────

  async function processarModalidade(codigoModalidade: number): Promise<{
    buscadas: number; inseridas: number; ignoradas: number; erros: string[]
  }> {
    let pagina = 1
    let totalPaginas = 1
    let modBuscadas = 0
    let modInseridas = 0
    let modIgnoradas = 0
    const modErros: string[] = []

    while (pagina <= totalPaginas && pagina <= MAX_PAGINAS) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 50000)

      let page: PncpPage
      try {
        page = await fetchPaginaModalidade(dataInicial, dataFinal, codigoModalidade, pagina, controller.signal)
      } catch (err) {
        clearTimeout(timeout)
        const msg = err instanceof Error ? err.message : String(err)
        modErros.push(`modalidade=${codigoModalidade} pag=${pagina}: ${msg}`)
        break
      }
      clearTimeout(timeout)

      if (!page.data || page.data.length === 0) break

      if (pagina === 1) {
        totalPaginas = Math.min(page.totalPaginas ?? 1, MAX_PAGINAS)
        console.log(`[cron/licitacoes-pncp] mod=${codigoModalidade} totalPaginas=${totalPaginas} totalRegistros=${page.totalRegistros}`)
      }

      modBuscadas += page.data.length

      const rows = page.data.map((item) => ({
        source_id:         item.numeroControlePNCP,
        portal:            "PNCP",
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
      }))

      const seen = new Set<string>()
      const deduped = rows.filter((r) => {
        if (!r.source_id || seen.has(r.source_id)) return false
        seen.add(r.source_id)
        return true
      })

      if (deduped.length === 0) { pagina++; continue }

      const sourceIds = deduped.map((r) => r.source_id)
      const { count: existentes } = await supabase
        .from("licitacoes")
        .select("source_id", { count: "exact", head: true })
        .in("source_id", sourceIds)

      const qtdExistentes = existentes ?? 0
      const qtdNovas = deduped.length - qtdExistentes

      const { error: upsertError } = await supabase
        .from("licitacoes")
        .upsert(deduped, { onConflict: "source_id" })

      if (upsertError) {
        modErros.push(`upsert mod=${codigoModalidade} pag=${pagina}: ${upsertError.message}`)
      } else {
        modInseridas += qtdNovas
        modIgnoradas += qtdExistentes
        console.log(`[cron/licitacoes-pncp] mod=${codigoModalidade} pag=${pagina}/${totalPaginas} +${qtdNovas} novas ~${qtdExistentes} existentes`)
      }

      pagina++
    }

    return { buscadas: modBuscadas, inseridas: modInseridas, ignoradas: modIgnoradas, erros: modErros }
  }

  // ─── Processa todas as modalidades em paralelo ────────────────────────────

  const resultados = await Promise.all(MODALIDADES.map(processarModalidade))

  for (const r of resultados) {
    buscadas += r.buscadas
    inseridas += r.inseridas
    ignoradas += r.ignoradas
    erros.push(...r.erros)
  }

  // ─── Resumo e log ─────────────────────────────────────────────────────────

  const resumo = {
    ok: erros.length === 0,
    buscadas,
    inseridas,
    ignoradas,
    janela: { inicio: dataInicial, fim: dataFinal },
    executado_em: agora.toISOString(),
    erros: erros.length > 0 ? erros : undefined,
  }

  console.log("[cron/licitacoes-pncp] Concluído:", resumo)

  await supabase.from("agent_logs").insert({
    agent: "cron/licitacoes-pncp",
    status: erros.length === 0 ? "success" : "error",
    mensagem: `buscadas=${buscadas} inseridas=${inseridas} ignoradas=${ignoradas}`,
    detalhes: resumo,
  })

  return NextResponse.json(resumo)
}

export async function GET(req: NextRequest) {
  try {
    return await executar(req)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[cron/licitacoes-pncp] Erro fatal:", msg)
    return NextResponse.json({ error: "Erro interno", detalhe: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return executar(req)
}
