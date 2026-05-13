import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// Cron de sincronização Licitar Digital → Supabase via scraper-service (Railway)
// Schedule: 0 7,13,19 * * * — 3x/dia
// Chama POST $SCRAPER_SERVICE_URL/scrape/licitar-digital
// O scraper-service roda Playwright headless (impossível no Vercel)
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

  const scraperUrl = process.env.SCRAPER_SERVICE_URL
  if (!scraperUrl) {
    return NextResponse.json(
      { error: "SCRAPER_SERVICE_URL não configurado" },
      { status: 500 }
    )
  }

  const agora = new Date()
  const supabase = createServiceClient()

  let resultado: Record<string, unknown> = {}
  let erroExterno: string | undefined

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000)

    const res = await fetch(`${scraperUrl}/scrape/licitar-digital`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      erroExterno = `scraper HTTP ${res.status}: ${body.slice(0, 200)}`
    } else {
      resultado = await res.json() as Record<string, unknown>
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    erroExterno = `scraper unreachable: ${msg}`
  }

  const resumo = {
    ok: !erroExterno && resultado.ok !== false,
    inseridas: resultado.inseridas ?? 0,
    ignoradas: resultado.ignoradas ?? 0,
    executado_em: agora.toISOString(),
    scraper_url: scraperUrl,
    erros: erroExterno
      ? [erroExterno, ...((resultado.erros as string[]) ?? [])]
      : resultado.erros ?? undefined,
  }

  console.log("[cron/licitacoes-licitar-digital] Concluído:", resumo)

  await supabase.from("agent_logs").insert({
    agent: "cron/licitacoes-licitar-digital",
    status: resumo.ok ? "success" : "error",
    mensagem: `inseridas=${resumo.inseridas} ignoradas=${resumo.ignoradas}${erroExterno ? ` erro=${erroExterno.slice(0, 100)}` : ""}`,
    detalhes: resumo,
  })

  return NextResponse.json(resumo)
}

export async function GET(req: NextRequest) {
  try {
    return await executar(req)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[cron/licitacoes-licitar-digital] Erro fatal:", msg)
    return NextResponse.json({ error: "Erro interno", detalhe: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return executar(req)
}
