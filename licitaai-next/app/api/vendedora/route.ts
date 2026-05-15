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
    const { lead_id, mensagem } = await req.json()

    if (!lead_id || !mensagem) {
      return NextResponse.json({ error: "lead_id e mensagem são obrigatórios" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Buscar histórico do lead
    const { data: conversas } = await supabase
      .from("lead_conversas")
      .select("role, conteudo")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: true })
      .limit(20)

    const historico: Anthropic.MessageParam[] = (conversas ?? []).map((c) => ({
      role: c.role as "user" | "assistant",
      content: c.conteudo as string,
    }))

    // Adicionar mensagem atual
    historico.push({ role: "user", content: mensagem })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_ANA,
      messages: historico,
    })

    const resposta = limparMarkdown(
      response.content[0].type === "text" ? response.content[0].text : ""
    )

    // Salvar mensagem do usuário + resposta da Ana
    await supabase.from("lead_conversas").insert([
      { lead_id, role: "user", conteudo: mensagem },
      { lead_id, role: "assistant", conteudo: resposta },
    ])

    // Atualizar ultima_interacao
    await supabase
      .from("leads")
      .update({ ultima_interacao: new Date().toISOString() })
      .eq("id", lead_id)

    const { data: leadAtualizado } = await supabase
      .from("leads")
      .select("id, nome, email, empresa, status, ultima_interacao")
      .eq("id", lead_id)
      .single()

    return NextResponse.json({ resposta, lead_atualizado: leadAtualizado })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
