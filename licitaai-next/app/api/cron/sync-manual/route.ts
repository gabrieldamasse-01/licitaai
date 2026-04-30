import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { fetchEffectiLicitacoes } from "@/lib/effecti"
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

type SyncManualResult = {
  inseridas: number
  ignoradas: number
  encerradas: number
  buscadas: number
  erros: string[]
  licitacoes_preview: LicitacaoPreview[]
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

  const janelas = gerarJanelas5Dias(begin, end)

  for (const janela of janelas) {
    let pagina = 0
    let totalPaginas = 1
    const MAX_PAGINAS = 100

    while (pagina < totalPaginas && pagina < MAX_PAGINAS) {
      const result = await fetchEffectiLicitacoes({
        begin: janela.beginISO,
        end: janela.endISO,
        pagina,
        itensPorPagina: 100,
      })

      if (result.error) {
        erros.push(`Effecti janela ${janela.beginISO.slice(0, 10)}→${janela.endISO.slice(0, 10)} página ${pagina}: ${result.error}`)
        break
      }

      if (pagina === 0) {
        totalPaginas = result.pagination.total_paginas || 1
      }

      if (result.licitacoes.length === 0) break

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

      const { error: insertError } = await supabase
        .from("licitacoes")
        .insert(deduped)

      if (insertError && !insertError.message.includes("duplicate") && !insertError.code?.includes("23505")) {
        erros.push(`Insert Effecti janela ${janela.beginISO.slice(0, 10)} página ${pagina}: ${insertError.message}`)
      } else {
        const qtdNovas = insertError ? 0 : deduped.length
        inseridas += qtdNovas

        if (preview.length < 50) {
          for (const row of deduped.slice(0, 50 - preview.length)) {
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

  return { inseridas, ignoradas, encerradas, buscadas, erros, licitacoes_preview: preview }
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

        const { error: insertError } = await supabase
          .from("licitacoes")
          .insert(deduped)

        if (insertError && !insertError.message.includes("duplicate") && !insertError.code?.includes("23505")) {
          erros.push(`Insert PNCP mod ${modalidade} pág ${pagina}: ${insertError.message}`)
        } else {
          const qtdNovas = insertError ? 0 : deduped.length
          inseridas += qtdNovas

          if (preview.length < 50) {
            for (const row of deduped.slice(0, 50 - preview.length)) {
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

  return { inseridas, ignoradas, encerradas, buscadas, erros, licitacoes_preview: preview }
}

export async function POST(req: NextRequest) {
  const adminOk = await isAdmin()
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

  if (!portal || !["effecti", "pncp"].includes(portal)) {
    return NextResponse.json({ error: "portal deve ser 'effecti' ou 'pncp'." }, { status: 400 })
  }
  if (!begin || !end) {
    return NextResponse.json({ error: "begin e end são obrigatórios." }, { status: 400 })
  }

  const supabase = createServiceClient()
  const resultado =
    portal === "effecti"
      ? await syncEffecti(supabase, begin, end)
      : await syncPncp(supabase, begin, end)

  await supabase.from("agent_logs").insert({
    agent: "sync-manual",
    status: resultado.erros.length === 0 ? "success" : "error",
    mensagem: `portal=${portal} buscadas=${resultado.buscadas} inseridas=${resultado.inseridas} ignoradas=${resultado.ignoradas} encerradas=${resultado.encerradas}`,
    detalhes: { portal, begin, end, ...resultado },
  })

  return NextResponse.json(resultado)
}
