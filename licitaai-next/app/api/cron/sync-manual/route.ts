import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { fetchEffectiLicitacoes } from "@/lib/effecti"
import { fetchBll } from "@/lib/portais/bll"
import { isAdmin } from "@/lib/is-admin"

export const maxDuration = 300

const PNCP_BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"
const PNCP_MODALIDADES = [6, 8, 9, 4, 5, 12]

type LicitacaoPreview = {
  objeto: string
  orgao: string
  uf: string | null
  valor: number | null
  status: string
  source_id: string
}

type JanelaResult = {
  inicio: string
  fim: string
  buscadas: number
  inseridas: number
  ignoradas: number
}

type SyncManualResult = {
  inseridas: number
  ignoradas: number
  encerradas: number
  buscadas: number
  erros: string[]
  licitacoes_preview: LicitacaoPreview[]
  janelas: JanelaResult[]
}

function safeDate(val: string | undefined | null): string | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function gerarJanelas5Dias(begin: string, end: string): Array<{ beginISO: string; endISO: string }> {
  const janelas: Array<{ beginISO: string; endISO: string }> = []
  const MAX_DIAS = 5

  let cursor = new Date(begin.includes("T") ? begin : `${begin}T00:00:00`)
  const limite = new Date(end.includes("T") ? end : `${end}T23:59:59`)

  while (cursor <= limite) {
    const fimJanela = new Date(cursor.getTime() + (MAX_DIAS - 1) * 24 * 60 * 60 * 1000)
    const fimEfetivo = fimJanela < limite ? fimJanela : limite

    const beginISO = cursor.toISOString().slice(0, 10) + "T00:00:00"
    const endISO = fimEfetivo.toISOString().slice(0, 10) + "T23:59:59"
    janelas.push({ beginISO, endISO })

    cursor = new Date(fimEfetivo.getTime() + 24 * 60 * 60 * 1000)
    cursor.setHours(0, 0, 0, 0)
  }

  return janelas
}

async function upsertComRetry(
  supabase: ReturnType<typeof createServiceClient>,
  rows: Record<string, unknown>[],
  tentativa = 1
): Promise<{ error?: { message: string; code?: string } }> {
  const { error } = await supabase
    .from("licitacoes")
    .upsert(rows, { onConflict: "source_id", ignoreDuplicates: false })

  if (error?.code === "40P01" && tentativa < 3) {
    await new Promise((r) => setTimeout(r, 1000 * tentativa))
    return upsertComRetry(supabase, rows, tentativa + 1)
  }

  return { error: error ?? undefined }
}

async function syncEffecti(
  supabase: ReturnType<typeof createServiceClient>,
  begin: string,
  end: string
): Promise<SyncManualResult> {
  const agora = new Date()
  let buscadas = 0
  let inseridas = 0
  let ignoradas = 0
  let encerradas = 0
  const erros: string[] = []
  const preview: LicitacaoPreview[] = []
  const janelaResults: JanelaResult[] = []

  const janelas = gerarJanelas5Dias(begin, end)

  for (const janela of janelas) {
    let pagina = 0
    let totalPaginas = 1
    const MAX_PAGINAS = 100
    let jBuscadas = 0
    let jInseridas = 0
    let jIgnoradas = 0

    while (pagina < totalPaginas && pagina < MAX_PAGINAS) {
      const result = await fetchEffectiLicitacoes({
        begin: janela.beginISO,
        end: janela.endISO,
        pagina,
        itensPorPagina: 50,
      })

      if (result.error) {
        erros.push(`Effecti janela ${janela.beginISO.slice(0, 10)}→${janela.endISO.slice(0, 10)} página ${pagina}: ${result.error}`)
        break
      }

      if (pagina === 0) {
        totalPaginas = result.pagination.total_paginas || 1
      }

      if (result.licitacoes.length === 0) break

      jBuscadas += result.licitacoes.length
      buscadas += result.licitacoes.length

      const rows = result.licitacoes.map((lic) => ({
        source_id: lic.processo || String(lic.idLicitacao),
        portal: lic.portal || "Effecti",
        orgao: lic.orgao,
        objeto: lic.objetoSemTags || lic.objeto,
        valor_estimado: lic.valorTotalEstimado || null,
        modalidade: lic.modalidade,
        uf: lic.uf?.substring(0, 2) || null,
        municipio: lic.unidadeGestora || null,
        data_publicacao: safeDate(lic.dataPublicacao),
        data_abertura: safeDate(lic.dataInicialProposta),
        data_encerramento: safeDate(lic.dataFinalProposta),
        source_url: lic.url || null,
        numero_processo: lic.processo || null,
        status: "ativa",
        updated_at: agora.toISOString(),
      }))

      const seen = new Set<string>()
      const deduped = rows.filter((r) => {
        if (seen.has(r.source_id)) return false
        seen.add(r.source_id)
        return true
      })

      const sourceIdsEffecti = deduped.map((r) => r.source_id)
      const { data: existentesEffecti } = await supabase
        .from("licitacoes")
        .select("source_id")
        .in("source_id", sourceIdsEffecti)

      const idsExistentesEffecti = new Set(existentesEffecti?.map((e) => e.source_id) ?? [])
      const novasEffecti = deduped.filter((r) => !idsExistentesEffecti.has(r.source_id))
      const qtdNovas = novasEffecti.length
      const qtdDuplicadas = deduped.length - qtdNovas

      const { error: upsertError } = await upsertComRetry(supabase, deduped as Record<string, unknown>[])

      if (upsertError) {
        erros.push(`Upsert Effecti janela ${janela.beginISO.slice(0, 10)} página ${pagina}: ${upsertError.message}`)
      } else {
        inseridas += qtdNovas
        ignoradas += qtdDuplicadas
        jInseridas += qtdNovas
        jIgnoradas += qtdDuplicadas

        if (preview.length < 200) {
          for (const row of novasEffecti.slice(0, 200 - preview.length)) {
            preview.push({
              objeto: (row.objeto ?? "").slice(0, 120),
              orgao: row.orgao ?? "",
              uf: row.uf,
              valor: row.valor_estimado,
              status: row.status,
              source_id: row.source_id,
            })
          }
        }
      }

      pagina++
    }

    janelaResults.push({
      inicio: janela.beginISO.slice(0, 10),
      fim: janela.endISO.slice(0, 10),
      buscadas: jBuscadas,
      inseridas: jInseridas,
      ignoradas: jIgnoradas,
    })
  }

  // Encerrar licitações expiradas
  const { count: qtdEncerradas } = await supabase
    .from("licitacoes")
    .select("source_id", { count: "exact", head: true })
    .eq("status", "ativa")
    .lt("data_encerramento", agora.toISOString())

  encerradas = qtdEncerradas ?? 0

  await supabase
    .from("licitacoes")
    .update({ status: "encerrada", updated_at: agora.toISOString() })
    .eq("status", "ativa")
    .lt("data_encerramento", agora.toISOString())

  return { inseridas, ignoradas, encerradas, buscadas, erros, licitacoes_preview: preview, janelas: janelaResults }
}

async function syncPncp(
  supabase: ReturnType<typeof createServiceClient>,
  begin: string,
  end: string
): Promise<SyncManualResult> {
  const agora = new Date()
  let buscadas = 0
  let inseridas = 0
  let ignoradas = 0
  let encerradas = 0
  const erros: string[] = []
  const preview: LicitacaoPreview[] = []

  function toApiDate(d: string) {
    return d.slice(0, 10).replace(/-/g, "")
  }

  const dataInicio = toApiDate(begin)
  const dataFim = toApiDate(end)

  for (const modalidade of PNCP_MODALIDADES) {
    let pagina = 1
    let totalPaginas = 1
    const MAX_PAGINAS = 20

    while (pagina <= totalPaginas && pagina <= MAX_PAGINAS) {
      const url = `${PNCP_BASE}?dataInicial=${dataInicio}&dataFinal=${dataFim}&codigoModalidadeContratacao=${modalidade}&pagina=${pagina}&tamanhoPagina=50`

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 50000)
        const res = await fetch(url, { signal: controller.signal, cache: "no-store" })
        clearTimeout(timeout)

        if (!res.ok) {
          erros.push(`PNCP modalidade ${modalidade} pág ${pagina}: HTTP ${res.status}`)
          break
        }

        const json = await res.json()
        const items: Array<{
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
          anoCompra: number
          sequencialCompra: number
        }> = json.data ?? []

        if (pagina === 1) {
          totalPaginas = json.totalPaginas ?? 1
        }

        if (items.length === 0) break

        buscadas += items.length

        const rows = items.map((item) => {
          const cnpj = item.orgaoEntidade?.cnpj ?? ""
          const sourceUrl = item.linkSistemaOrigem
            ?? `https://pncp.gov.br/app/editais/${cnpj}/${item.anoCompra}/${String(item.sequencialCompra).padStart(7, "0")}`
          return {
            source_id: item.numeroControlePNCP,
            portal: "Portal Nacional de Contratações Públicas - PNCP",
            orgao: item.orgaoEntidade?.razaoSocial ?? item.unidadeOrgao?.nomeUnidade ?? "",
            objeto: item.objetoCompra ?? "",
            valor_estimado: item.valorTotalEstimado || null,
            modalidade: item.modalidadeNome ?? "",
            uf: item.unidadeOrgao?.ufSigla ?? null,
            municipio: item.unidadeOrgao?.municipioNome ?? null,
            data_publicacao: safeDate(item.dataPublicacaoPncp),
            data_abertura: safeDate(item.dataAberturaProposta),
            data_encerramento: safeDate(item.dataEncerramentoProposta),
            source_url: sourceUrl,
            numero_processo: item.processo ?? null,
            status: "ativa",
            updated_at: agora.toISOString(),
          }
        })

        const seen = new Set<string>()
        const deduped = rows.filter((r) => {
          if (seen.has(r.source_id)) return false
          seen.add(r.source_id)
          return true
        })

        const sourceIdsPncp = deduped.map((r) => r.source_id)
        const { data: existentesPncp } = await supabase
          .from("licitacoes")
          .select("source_id")
          .in("source_id", sourceIdsPncp)

        const idsExistentesPncp = new Set(existentesPncp?.map((e) => e.source_id) ?? [])
        const novasPncp = deduped.filter((r) => !idsExistentesPncp.has(r.source_id))
        const qtdNovasPncp = novasPncp.length
        const qtdDuplicadasPncp = deduped.length - qtdNovasPncp

        const { error: upsertError } = await supabase
          .from("licitacoes")
          .upsert(deduped, { onConflict: "source_id", ignoreDuplicates: false })

        if (upsertError) {
          erros.push(`Upsert PNCP mod ${modalidade} pág ${pagina}: ${upsertError.message}`)
        } else {
          inseridas += qtdNovasPncp
          ignoradas += qtdDuplicadasPncp

          if (preview.length < 200) {
            for (const row of novasPncp.slice(0, 200 - preview.length)) {
              preview.push({
                objeto: (row.objeto ?? "").slice(0, 120),
                orgao: row.orgao ?? "",
                uf: row.uf,
                valor: row.valor_estimado,
                status: row.status,
                source_id: row.source_id,
              })
            }
          }
        }
      } catch (err) {
        erros.push(`PNCP modalidade ${modalidade} pág ${pagina}: ${String(err)}`)
        break
      }

      pagina++
    }
  }

  // Encerrar licitações expiradas
  const { count: qtdEncerradas } = await supabase
    .from("licitacoes")
    .select("source_id", { count: "exact", head: true })
    .eq("status", "ativa")
    .lt("data_encerramento", agora.toISOString())

  encerradas = qtdEncerradas ?? 0

  await supabase
    .from("licitacoes")
    .update({ status: "encerrada", updated_at: agora.toISOString() })
    .eq("status", "ativa")
    .lt("data_encerramento", agora.toISOString())

  return { inseridas, ignoradas, encerradas, buscadas, erros, licitacoes_preview: preview, janelas: [{ inicio: begin.slice(0, 10), fim: end.slice(0, 10), buscadas, inseridas, ignoradas }] }
}

async function syncBll(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<SyncManualResult> {
  const agora = new Date()
  const erros: string[] = []
  const preview: LicitacaoPreview[] = []

  const { licitacoes, total: buscadas, erros: fetchErros } = await fetchBll()
  erros.push(...fetchErros)

  let inseridas = 0
  let ignoradas = 0

  if (licitacoes.length > 0) {
    const sourceIds = licitacoes.map((l) => l.source_id)
    const { data: existentes } = await supabase
      .from("licitacoes")
      .select("source_id")
      .in("source_id", sourceIds)

    const idsExistentes = new Set(existentes?.map((e) => e.source_id) ?? [])
    const novas = licitacoes.filter((l) => !idsExistentes.has(l.source_id))
    ignoradas = licitacoes.length - novas.length

    const { error: upsertError } = await upsertComRetry(supabase, licitacoes as Record<string, unknown>[])
    if (upsertError) {
      erros.push(`Upsert BLL: ${upsertError.message}`)
    } else {
      inseridas = novas.length
      for (const row of novas.slice(0, 200)) {
        preview.push({
          objeto: (row.objeto ?? "").slice(0, 120),
          orgao: row.orgao ?? "",
          uf: row.uf,
          valor: null,
          status: row.status,
          source_id: row.source_id,
        })
      }
    }
  }

  const hoje = agora.toISOString().slice(0, 10)
  return {
    inseridas,
    ignoradas,
    encerradas: 0,
    buscadas,
    erros,
    licitacoes_preview: preview,
    janelas: [{ inicio: hoje, fim: hoje, buscadas, inseridas, ignoradas }],
  }
}

export async function POST(req: NextRequest) {
  // Aceita CRON_SECRET via Bearer (chamadas via terminal/script)
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth
  const cronOk = token === process.env.CRON_SECRET

  // Ou sessão de admin via UI
  const adminOk = cronOk || (await isAdmin())
  if (!adminOk) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  let body: { portal?: string; begin?: string; end?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 })
  }

  const { portal, begin, end } = body

  if (!portal || !["effecti", "pncp", "bll"].includes(portal)) {
    return NextResponse.json({ error: "portal deve ser 'effecti', 'pncp' ou 'bll'." }, { status: 400 })
  }
  if (portal !== "bll" && (!begin || !end)) {
    return NextResponse.json({ error: "begin e end são obrigatórios." }, { status: 400 })
  }

  const supabase = createServiceClient()
  const resultado =
    portal === "effecti"
      ? await syncEffecti(supabase, begin!, end!)
      : portal === "pncp"
        ? await syncPncp(supabase, begin!, end!)
        : await syncBll(supabase)

  await supabase.from("agent_logs").insert({
    agent: "sync-manual",
    status: resultado.erros.length === 0 ? "success" : "error",
    mensagem: `portal=${portal} buscadas=${resultado.buscadas} inseridas=${resultado.inseridas} ignoradas=${resultado.ignoradas} encerradas=${resultado.encerradas}`,
    detalhes: { portal, begin, end, ...resultado },
  })

  return NextResponse.json(resultado)
}
