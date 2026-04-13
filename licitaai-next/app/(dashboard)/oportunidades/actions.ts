"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { calcularScore as calcScore } from "@/lib/scoring"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Empresa = {
  id: string
  razao_social: string
  cnpj: string
  porte: string
  cnae: string[]
}

export type Oportunidade = {
  id: string
  source_id: string | null
  orgao: string | null
  objeto: string | null
  valor_estimado: number | null
  modalidade: string | null
  uf: string | null
  data_encerramento: string | null
  data_publicacao: string | null
  source_url: string | null
  portal: string | null
  status: string | null
  score: number
  scoreLabel: string
  motivo: string
}

// ─── Checklist de habilitação ─────────────────────────────────────────────────

export type ChecklistItem = {
  nome: string
  status: "ok" | "vencendo" | "vencido" | "faltando"
  validade: string | null
  nome_arquivo: string | null
}

const DOCS_OBRIGATORIOS: { nome: string; keywords: string[] }[] = [
  {
    nome: "CND Federal",
    keywords: ["cnd federal", "certidao negativa federal", "debitos federais", "receita federal"],
  },
  {
    nome: "CND Estadual",
    keywords: ["cnd estadual", "certidao negativa estadual", "debito estadual"],
  },
  {
    nome: "CND Municipal",
    keywords: ["cnd municipal", "certidao negativa municipal", "debito municipal", "iss"],
  },
  {
    nome: "Certificado de Regularidade FGTS",
    keywords: ["fgts", "regularidade fgts", "crf fgts"],
  },
  {
    nome: "CNDT",
    keywords: ["cndt", "debitos trabalhistas", "trabalhista"],
  },
  {
    nome: "Contrato Social / Estatuto",
    keywords: ["contrato social", "estatuto", "ato constitutivo", "registro"],
  },
  {
    nome: "Procuração",
    keywords: ["procuracao", "procurador"],
  },
]

function normStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export async function buscarChecklistDocumentos(empresaId: string): Promise<{
  itens: ChecklistItem[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { itens: [], error: "Não autenticado" }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id")
    .eq("id", empresaId)
    .eq("user_id", user.id)
    .single()
  if (!empresa) return { itens: [], error: "Empresa não encontrada" }

  const { data: docs } = await supabase
    .from("documents")
    .select("tipo, status, data_validade, nome_arquivo")
    .eq("company_id", empresaId)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em30 = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

  const itens: ChecklistItem[] = DOCS_OBRIGATORIOS.map(({ nome, keywords }) => {
    const match = (docs ?? []).find((d) => {
      const tipoNorm = normStr(d.tipo)
      return keywords.some((kw) => tipoNorm.includes(normStr(kw)))
    })

    if (!match) return { nome, status: "faltando", validade: null, nome_arquivo: null }

    const validade = match.data_validade
      ? new Date(match.data_validade + "T00:00:00")
      : null

    if (match.status === "vencido" || (validade && validade < hoje)) {
      return { nome, status: "vencido", validade: match.data_validade, nome_arquivo: match.nome_arquivo }
    }
    if (validade && validade <= em30) {
      return { nome, status: "vencendo", validade: match.data_validade, nome_arquivo: match.nome_arquivo }
    }
    return { nome, status: "ok", validade: match.data_validade, nome_arquivo: match.nome_arquivo }
  })

  return { itens }
}

// ─── Server actions ───────────────────────────────────────────────────────────

export async function buscarOportunidades(empresaId: string): Promise<{
  oportunidades: Oportunidade[]
  analisadas: number
  docsVencidos: boolean
  docsVencendo: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { oportunidades: [], analisadas: 0, docsVencidos: false, docsVencendo: false, error: "Não autenticado" }
  }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id, razao_social, cnpj, porte, cnae")
    .eq("id", empresaId)
    .eq("user_id", user.id)
    .single()

  if (!empresa) {
    return { oportunidades: [], analisadas: 0, docsVencidos: false, docsVencendo: false, error: "Empresa não encontrada" }
  }

  // Verificar status dos documentos da empresa
  const { itens: checklistItens } = await buscarChecklistDocumentos(empresaId)
  const docsVencidos = checklistItens.some((i) => i.status === "vencido" || i.status === "faltando")
  const docsVencendo = checklistItens.some((i) => i.status === "vencendo")

  // Licitações dos últimos 5 dias sincronizadas no Supabase
  const inicio = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)

  const { data: licitacoes, error } = await supabase
    .from("licitacoes")
    .select("id, source_id, orgao, objeto, valor_estimado, modalidade, uf, data_encerramento, data_publicacao, source_url, portal, status")
    .gte("updated_at", inicio.toISOString())
    .eq("status", "ativa")
    .not("objeto", "is", null)
    .order("updated_at", { ascending: false })
    .limit(500)

  if (error) {
    return { oportunidades: [], analisadas: 0, docsVencidos, docsVencendo, error: error.message }
  }

  const analisadas = licitacoes?.length ?? 0

  const oportunidades: Oportunidade[] = (licitacoes ?? [])
    .map((lic) => {
      const { score, scoreLabel, motivo } = calcScore(empresa, {
        objeto: lic.objeto ?? "",
        modalidade: lic.modalidade ?? "",
      })
      return {
        id: lic.id,
        source_id: lic.source_id,
        orgao: lic.orgao,
        objeto: lic.objeto,
        valor_estimado: lic.valor_estimado,
        modalidade: lic.modalidade,
        uf: lic.uf,
        data_encerramento: lic.data_encerramento,
        data_publicacao: lic.data_publicacao,
        source_url: lic.source_url,
        portal: lic.portal,
        status: lic.status,
        score,
        scoreLabel,
        motivo,
      }
    })
    .filter((o) => o.score >= 60)
    .sort((a, b) => b.score - a.score)

  return { oportunidades, analisadas, docsVencidos, docsVencendo }
}

export async function salvarOportunidade(
  empresaId: string,
  licitacaoId: string,
  score: number
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  // Garante que empresaId pertence ao usuário autenticado
  const { data: empresaOwnership } = await supabase
    .from("companies")
    .select("id")
    .eq("id", empresaId)
    .eq("user_id", user.id)
    .single()

  if (!empresaOwnership) return { error: "Empresa não autorizada" }

  // Upsert do match com o UUID da licitação
  const { error: matchError } = await supabase.from("matches").upsert(
    {
      company_id: empresaId,
      licitacao_id: licitacaoId,
      relevancia_score: score,
      status: "pendente",
    },
    { onConflict: "company_id,licitacao_id" }
  )

  if (matchError) return { error: "Erro ao salvar match: " + matchError.message }

  // Busca objeto da licitação para a notificação
  const { data: lic } = await supabase
    .from("licitacoes")
    .select("orgao, objeto")
    .eq("id", licitacaoId)
    .single()

  if (lic) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      tipo: "oportunidade_salva",
      titulo: "Oportunidade salva!",
      mensagem: `${lic.orgao} — ${(lic.objeto ?? "").slice(0, 120)}`,
      link: "/oportunidades",
    })
  }

  revalidatePath("/oportunidades")
  return { success: true }
}
