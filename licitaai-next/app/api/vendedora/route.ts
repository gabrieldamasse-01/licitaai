import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import Anthropic from "@anthropic-ai/sdk"

const SYSTEM_ANA = `Você é Ana, consultora especialista em licitações públicas da LicitaAI.
Seu objetivo é converter leads em clientes pagantes do plano Pro (R$97/mês).
Seja simpática, profissional e objetiva. Fale em português brasileiro informal.
Sempre mencione benefícios concretos: mais de 18.000 licitações monitoradas, score IA por CNAE,
alertas automáticos, análise de editais com inteligência artificial.
Tente marcar uma demonstração ou converter direto para o plano Pro.
Nunca ofereça desconto sem aprovação do gestor.`

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

    const resposta =
      response.content[0].type === "text" ? response.content[0].text : ""

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
