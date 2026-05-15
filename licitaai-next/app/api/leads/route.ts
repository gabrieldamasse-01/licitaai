import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import Anthropic from "@anthropic-ai/sdk"

const SYSTEM_ANA = `Você é Ana, consultora da LicitaAI especializada em licitações públicas.
Responda em português brasileiro, de forma consultiva e profissional — não como vendedora agressiva.
Seja objetiva: máximo 3 parágrafos curtos por resposta.
Use no máximo 1 emoji por mensagem. Nunca use asteriscos, negrito, itálico ou bullet points.
Escreva em texto corrido, simples e direto.
Quando relevante, mencione benefícios reais: mais de 18.000 licitações monitoradas, score de relevância por CNAE, alertas automáticos, análise de editais com IA.
Plano Pro: R$97/mês. Tente marcar uma demo ou encaminhar para o plano Pro.
Nunca ofereça desconto sem aprovação do gestor.`

function limparMarkdown(texto: string): string {
  return texto
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/✅\s/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { nome, email, empresa, telefone, origem } = await req.json()

    if (!nome || !email) {
      return NextResponse.json({ error: "nome e email são obrigatórios" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Inserir lead (ignorar duplicatas por email)
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .upsert(
        {
          nome,
          email,
          empresa: empresa ?? null,
          telefone: telefone ?? null,
          origem: origem ?? "landing_page",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select("id, nome, email, empresa, status")
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: "Erro ao salvar lead" }, { status: 500 })
    }

    // Gerar primeira mensagem da Ana
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const primeiroMensagemUser = `Olá! Me chamo ${nome}${empresa ? `, trabalho na ${empresa}` : ""}. Gostaria de saber mais sobre o LicitaAI.`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_ANA,
      messages: [{ role: "user", content: primeiroMensagemUser }],
    })

    const primeiraResposta = limparMarkdown(
      response.content[0].type === "text" ? response.content[0].text : ""
    )

    // Salvar as duas mensagens no histórico
    await supabase.from("lead_conversas").insert([
      { lead_id: lead.id, role: "user", conteudo: primeiroMensagemUser },
      { lead_id: lead.id, role: "assistant", conteudo: primeiraResposta },
    ])

    // Atualizar ultima_interacao do lead
    await supabase
      .from("leads")
      .update({ ultima_interacao: new Date().toISOString(), status: "contactado" })
      .eq("id", lead.id)

    return NextResponse.json({
      lead_id: lead.id,
      primeira_mensagem: primeiraResposta,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
