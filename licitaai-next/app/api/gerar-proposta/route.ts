import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json() as { licitacao_id?: string; company_id?: string }
    const { licitacao_id, company_id } = body

    if (!licitacao_id || !company_id) {
      return NextResponse.json({ error: "licitacao_id e company_id são obrigatórios" }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: lic } = await service
      .from("licitacoes")
      .select("objeto, orgao, valor_estimado, data_encerramento, source_url")
      .eq("id", licitacao_id)
      .single()

    if (!lic) {
      return NextResponse.json({ error: "Licitação não encontrada" }, { status: 404 })
    }

    const { data: empresa } = await service
      .from("companies")
      .select("razao_social, cnpj, cnae")
      .eq("id", company_id)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada ou não autorizada" }, { status: 403 })
    }

    const valorFormatado = lic.valor_estimado
      ? lic.valor_estimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Não informado"

    const encerramentoFormatado = lic.data_encerramento
      ? new Date(lic.data_encerramento).toLocaleDateString("pt-BR")
      : "Não informado"

    const prompt = `Você é especialista em licitações públicas brasileiras. Gere uma proposta comercial profissional e completa para participação na seguinte licitação:

LICITAÇÃO:
- Objeto: ${lic.objeto}
- Órgão: ${lic.orgao}
- Valor estimado: ${valorFormatado}
- Encerramento: ${encerramentoFormatado}

EMPRESA:
- Razão Social: ${empresa.razao_social}
- CNPJ: ${empresa.cnpj}
- CNAE: ${empresa.cnae}

A proposta deve conter:
1. Identificação da empresa
2. Objeto da proposta
3. Descrição técnica dos serviços/produtos
4. Prazo de execução
5. Validade da proposta (60 dias)
6. Declarações legais obrigatórias

Escreva em português formal, adequado para licitações públicas brasileiras.`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const block = message.content[0]
    if (block.type !== "text") {
      return NextResponse.json({ error: "Resposta inesperada da IA" }, { status: 500 })
    }

    const proposta = block.text

    await service.from("propostas_geradas").insert({
      user_id: user.id,
      licitacao_id,
      company_id,
      proposta_texto: proposta,
    })

    return NextResponse.json({ proposta })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Erro ao gerar proposta:", msg)
    return NextResponse.json({ error: "Erro ao gerar proposta" }, { status: 500 })
  }
}
