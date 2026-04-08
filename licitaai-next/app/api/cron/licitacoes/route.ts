import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { fetchEffectiLicitacoes } from "@/lib/effecti"

// Cron de sincronização de licitações — executa 3x/dia via Vercel Cron
// Schedule: 0 9,15,21 * * * (UTC) — equivale a 6h, 12h, 18h BRT
// Janela: últimos 5 dias (máximo permitido pela API Effecti)
// Aceita GET (Vercel Cron) e POST (chamada manual) com Authorization: Bearer <CRON_SECRET>

export const maxDuration = 300 // 5 min — necessário para percorrer muitas páginas

function autenticar(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth
  return token === process.env.CRON_SECRET
}

async function executar(req: NextRequest): Promise<NextResponse> {
  if (!autenticar(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const agora = new Date()

  // Janela: 5 dias para trás (limite máximo da Effecti)
  const inicio = new Date(agora.getTime() - 5 * 24 * 60 * 60 * 1000)
  const beginISO = inicio.toISOString().slice(0, 19)  // "2026-04-02T00:00:00"
  const endISO = agora.toISOString().slice(0, 19)

  let inseridas = 0
  let atualizadas = 0
  let encerradas = 0
  let totalPaginas = 1
  let pagina = 0
  const erros: string[] = []
  const MAX_PAGINAS = 50  // proteção contra loop infinito

  console.log(`[cron/licitacoes] Iniciando — janela: ${beginISO} → ${endISO}`)

  // ─── Percorre todas as páginas da Effecti ──────────────────────────────────

  while (pagina < totalPaginas && pagina < MAX_PAGINAS) {
    const result = await fetchEffectiLicitacoes({
      begin: beginISO,
      end: endISO,
      pagina,
      itensPorPagina: 100,
    })

    if (result.error) {
      erros.push(`Página ${pagina}: ${result.error}`)
      console.error(`[cron/licitacoes] Erro na página ${pagina}:`, result.error)
      break
    }

    // Atualiza total de páginas com a resposta da primeira chamada
    if (pagina === 0) {
      totalPaginas = result.pagination.total_paginas || 1
      console.log(`[cron/licitacoes] Total de páginas: ${totalPaginas} | Total de registros: ${result.pagination.total_registros}`)
    }

    if (result.licitacoes.length === 0) break

    // Monta as linhas para upsert
    const rows = result.licitacoes.map((lic) => ({
      source_id:         lic.processo || String(lic.idLicitacao),
      portal:            lic.portal || "Effecti",
      orgao:             lic.orgao,
      objeto:            lic.objetoSemTags || lic.objeto,
      valor_estimado:    lic.valorTotalEstimado || null,
      modalidade:        lic.modalidade,
      uf:                lic.uf?.substring(0, 2) || null,
      municipio:         lic.unidadeGestora || null,
      data_publicacao:   lic.dataPublicacao ? new Date(lic.dataPublicacao).toISOString() : null,
      data_abertura:     lic.dataInicialProposta ? new Date(lic.dataInicialProposta).toISOString() : null,
      data_encerramento: lic.dataFinalProposta ? new Date(lic.dataFinalProposta).toISOString() : null,
      source_url:        lic.url || null,
      numero_processo:   lic.processo || null,
      status:            "ativa",
      updated_at:        agora.toISOString(),
    }))

    // Conta source_ids já existentes para distinguir inseridas vs atualizadas
    const sourceIds = rows.map((r) => r.source_id)
    const { count: existentes } = await supabase
      .from("licitacoes")
      .select("source_id", { count: "exact", head: true })
      .in("source_id", sourceIds)

    const qtdExistentes = existentes ?? 0
    const qtdNovas = rows.length - qtdExistentes

    // Upsert em lote
    const { error: upsertError } = await supabase
      .from("licitacoes")
      .upsert(rows, { onConflict: "source_id" })

    if (upsertError) {
      erros.push(`Upsert página ${pagina}: ${upsertError.message}`)
      console.error(`[cron/licitacoes] Erro no upsert página ${pagina}:`, upsertError.message)
    } else {
      inseridas += qtdNovas
      atualizadas += qtdExistentes
      console.log(`[cron/licitacoes] Página ${pagina + 1}/${totalPaginas} — +${qtdNovas} novas, ~${qtdExistentes} atualizadas`)
    }

    pagina++
  }

  // ─── Marca licitações expiradas como encerradas ────────────────────────────

  // Primeiro conta quantas vão ser encerradas
  const { count: qtdEncerradas } = await supabase
    .from("licitacoes")
    .select("source_id", { count: "exact", head: true })
    .eq("status", "ativa")
    .lt("data_encerramento", agora.toISOString())

  encerradas = qtdEncerradas ?? 0

  // Depois atualiza o status
  await supabase
    .from("licitacoes")
    .update({ status: "encerrada", updated_at: agora.toISOString() })
    .eq("status", "ativa")
    .lt("data_encerramento", agora.toISOString())

  // ─── Log final ────────────────────────────────────────────────────────────

  const resumo = {
    ok: erros.length === 0,
    inseridas,
    atualizadas,
    encerradas,
    total_paginas: totalPaginas,
    paginas_processadas: pagina,
    janela: { inicio: beginISO, fim: endISO },
    executado_em: agora.toISOString(),
    erros: erros.length > 0 ? erros : undefined,
  }

  console.log("[cron/licitacoes] Concluído:", resumo)

  // Registrar no agent_logs
  await supabase.from("agent_logs").insert({
    agent: "cron/licitacoes",
    status: erros.length === 0 ? "success" : "error",
    mensagem: `inseridas=${inseridas} atualizadas=${atualizadas} encerradas=${encerradas} páginas=${pagina}/${totalPaginas}`,
    detalhes: resumo,
  })

  return NextResponse.json(resumo)
}

export async function GET(req: NextRequest) {
  return executar(req)
}

export async function POST(req: NextRequest) {
  return executar(req)
}
