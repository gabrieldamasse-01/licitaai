import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const PROMPT = `Analise este documento e extraia as seguintes informações em JSON:
{
  "nome_documento": "string (nome/tipo do documento, ex: CND Federal, Alvará de Funcionamento)",
  "data_emissao": "string (formato YYYY-MM-DD ou null)",
  "data_validade": "string (formato YYYY-MM-DD ou null)",
  "orgao_emissor": "string (quem emitiu o documento ou null)"
}
Retorne APENAS o JSON, sem explicações.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("arquivo") as File | null
    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const TIPOS_SUPORTADOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if (!TIPOS_SUPORTADOS.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp"

    const content: Anthropic.MessageParam["content"] =
      file.type === "application/pdf"
        ? [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: PROMPT },
          ]
        : [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as ImageMediaType,
                data: base64,
              },
            },
            { type: "text", text: PROMPT },
          ]

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content }],
    })

    const text =
      message.content[0].type === "text" ? message.content[0].text.trim() : ""

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return NextResponse.json({ error: "IA não retornou JSON válido" }, { status: 500 })
    }

    const extracted = JSON.parse(match[0]) as {
      nome_documento: string | null
      data_emissao: string | null
      data_validade: string | null
      orgao_emissor: string | null
    }

    return NextResponse.json({ success: true, data: extracted })
  } catch (err) {
    console.error("[analisar-documento]", err)
    return NextResponse.json({ error: "Erro ao analisar documento" }, { status: 500 })
  }
}
