import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

const PROMPT = `Você é especialista em licitações públicas brasileiras. Analise este edital e extraia APENAS a seção de habilitação/documentação. Liste todos os documentos exigidos. Para cada um: nome do documento, se é obrigatório (true/false), e o trecho exato do edital que exige. Retorne JSON puro no formato:
[{"nome": "string", "obrigatorio": true, "trecho_edital": "string"}]
Retorne APENAS o array JSON, sem explicações adicionais.`

type DocumentoExtraido = {
  nome: string
  obrigatorio: boolean
  trecho_edital: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json() as { licitacao_id: string; source_url: string | null }
    const { licitacao_id, source_url } = body

    if (!licitacao_id) {
      return NextResponse.json({ error: "licitacao_id obrigatório" }, { status: 400 })
    }

    const service = createServiceClient()

    // Retornar cache se já extraído
    const { data: cached } = await service
      .from("edital_documentos_exigidos")
      .select("id, nome_exigido, obrigatorio, trecho_edital, extraido_por_ia")
      .eq("licitacao_id", licitacao_id)

    if (cached && cached.length > 0) {
      return NextResponse.json({ documentos: cached, fromCache: true })
    }

    if (!source_url) {
      return NextResponse.json({ error: "URL do edital não disponível" }, { status: 400 })
    }

    // Buscar PDF do edital
    let pdfBase64: string | null = null
    try {
      const resp = await fetch(source_url, {
        headers: { "User-Agent": "LicitaAI/1.0" },
        signal: AbortSignal.timeout(30000),
      })
      if (resp.ok) {
        const contentType = resp.headers.get("content-type") ?? ""
        if (contentType.includes("pdf")) {
          const buffer = await resp.arrayBuffer()
          pdfBase64 = Buffer.from(buffer).toString("base64")
        }
      }
    } catch {
      // PDF indisponível — prosseguir sem ele
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let documentos: DocumentoExtraido[] = []

    if (pdfBase64) {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      })
      const text = message.content[0].type === "text" ? message.content[0].text.trim() : ""
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        documentos = JSON.parse(match[0]) as DocumentoExtraido[]
      }
    }

    if (documentos.length === 0) {
      return NextResponse.json({
        error: "Não foi possível extrair documentos do edital",
      }, { status: 422 })
    }

    // Salvar no banco
    const rows = documentos.map((d) => ({
      licitacao_id,
      nome_exigido: d.nome,
      obrigatorio: d.obrigatorio ?? true,
      extraido_por_ia: true,
      trecho_edital: d.trecho_edital ?? null,
    }))

    await service
      .from("edital_documentos_exigidos")
      .upsert(rows, { onConflict: "licitacao_id,nome_exigido" })

    return NextResponse.json({ documentos: rows, fromCache: false })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Erro ao extrair documentos do edital:", msg)
    return NextResponse.json({ error: "Erro ao processar edital" }, { status: 500 })
  }
}
