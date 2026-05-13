import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { fetchBll } from "@/lib/portais/bll"

// Cron de sincronização BLL → Supabase
// Schedule: 0 6,9,12,15,18,21 * * * — 6x/dia
// Busca as 100 licitações mais recentes via scraping HTML público
// Para se 100/100 já existem no banco (banco atualizado)
// Aceita GET (Vercel Cron) e POST (chamada manual) com Authorization: Bearer <CRON_SECRET>

export const maxDuration = 60

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

  const { licitacoes, total: buscadas, erros } = await fetchBll()

  let inseridas = 0
  let ignoradas = 0
  let parou_cedo = false

  if (licitacoes.length > 0) {
    const sourceIds = licitacoes.map((l) => l.source_id)

    const { count: existentes } = await supabase
      .from("licitacoes")
      .select("source_id", { count: "exact", head: true })
      .in("source_id", sourceIds)

    const qtdExistentes = existentes ?? 0
    const qtdNovas = licitacoes.length - qtdExistentes

    // Parada inteligente: se todas já existem, banco está atualizado
    if (qtdExistentes === licitacoes.length) {
      parou_cedo = true
      ignoradas = qtdExistentes
      console.log(`[cron/licitacoes-bll] ${qtdExistentes}/${licitacoes.length} já existiam — banco atualizado, sem upsert necessário`)
    } else {
      const { error: upsertError } = await supabase
        .from("licitacoes")
        .upsert(licitacoes, { onConflict: "source_id" })

      if (upsertError) {
        erros.push(`upsert: ${upsertError.message}`)
      } else {
        inseridas = qtdNovas
        ignoradas = qtdExistentes
      }
    }
  }

  const resumo = {
    ok: erros.length === 0,
    buscadas,
    inseridas,
    ignoradas,
    parou_cedo,
    executado_em: agora.toISOString(),
    erros: erros.length > 0 ? erros : undefined,
  }

  console.log("[cron/licitacoes-bll] Concluído:", resumo)

  await supabase.from("agent_logs").insert({
    agent: "cron/licitacoes-bll",
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
    console.error("[cron/licitacoes-bll] Erro fatal:", msg)
    return NextResponse.json({ error: "Erro interno", detalhe: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return executar(req)
}
