import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { fetchComprasNet } from "@/lib/portais/comprasnet"

// Cron de sincronização ComprasNet (SIASG/Compras.gov.br) — via API PNCP filtrada por órgãos federais
// Schedule: 0 9,15,21 * * * (UTC) — equivale a 6h, 12h, 18h BRT
// Janela: últimos 5 dias
// Aceita GET (Vercel Cron) e POST (chamada manual) com Authorization: Bearer <CRON_SECRET>

export const maxDuration = 300

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

  // Janela: 5 dias para trás
  const inicio = new Date(agora.getTime() - 5 * 24 * 60 * 60 * 1000)
  const begin = inicio.toISOString().slice(0, 10)
  const end = agora.toISOString().slice(0, 10)

  console.log(`[cron/licitacoes-comprasnet] Iniciando — janela: ${begin} → ${end}`)

  const { licitacoes, total, erros } = await fetchComprasNet(begin, end)

  let inseridas = 0
  let ignoradas = 0

  if (licitacoes.length > 0) {
    // Conta existentes para distinguir novas vs atualizadas
    const sourceIds = licitacoes.map((l) => l.source_id)
    const { count: existentes } = await supabase
      .from("licitacoes")
      .select("source_id", { count: "exact", head: true })
      .in("source_id", sourceIds)

    const qtdExistentes = existentes ?? 0
    const qtdNovas = licitacoes.length - qtdExistentes

    const { error: upsertError } = await supabase
      .from("licitacoes")
      .upsert(licitacoes, { onConflict: "source_id" })

    if (upsertError) {
      erros.push(`Upsert: ${upsertError.message}`)
      console.error("[cron/licitacoes-comprasnet] Erro no upsert:", upsertError.message)
    } else {
      inseridas = qtdNovas
      ignoradas = qtdExistentes
    }
  }

  // Marca licitações ComprasNet expiradas como encerradas
  const { count: qtdEncerradas } = await supabase
    .from("licitacoes")
    .select("source_id", { count: "exact", head: true })
    .eq("status", "ativa")
    .eq("portal", "ComprasNet")
    .lt("data_encerramento", agora.toISOString())

  const encerradas = qtdEncerradas ?? 0

  await supabase
    .from("licitacoes")
    .update({ status: "encerrada", updated_at: agora.toISOString() })
    .eq("status", "ativa")
    .eq("portal", "ComprasNet")
    .lt("data_encerramento", agora.toISOString())

  const resumo = {
    ok: erros.length === 0,
    buscadas: total,
    inseridas,
    ignoradas,
    encerradas,
    janela: { inicio: begin, fim: end },
    executado_em: agora.toISOString(),
    erros: erros.length > 0 ? erros : undefined,
  }

  console.log("[cron/licitacoes-comprasnet] Concluído:", resumo)

  await supabase.from("agent_logs").insert({
    agent: "cron/licitacoes-comprasnet",
    status: erros.length === 0 ? "success" : "error",
    mensagem: `buscadas=${total} inseridas=${inseridas} ignoradas=${ignoradas} encerradas=${encerradas}`,
    detalhes: resumo,
  })

  return NextResponse.json(resumo)
}

export async function GET(req: NextRequest) {
  try {
    return await executar(req)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[cron/licitacoes-comprasnet] Erro fatal:", msg)
    return NextResponse.json({ error: "Erro interno", detalhe: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return executar(req)
}
