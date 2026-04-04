"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { fetchEffectiLicitacoes, type NormalizedLicitacao } from "@/lib/effecti"
import { calcularScore as calcScore, scoreLabel as getScoreLabel, extrairKeywords as extractKeywords } from "@/lib/scoring"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Empresa = {
  id: string
  razao_social: string
  cnpj: string
  porte: string
  cnae: string[]
}

export type Oportunidade = NormalizedLicitacao & {
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
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { oportunidades: [], analisadas: 0, error: "Não autenticado" }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id, razao_social, cnpj, porte, cnae")
    .eq("id", empresaId)
    .eq("user_id", user.id)
    .single()

  if (!empresa) return { oportunidades: [], analisadas: 0, error: "Empresa não encontrada" }

  // Janela de 5 dias (máximo permitido pela Effecti)
  const hoje = new Date()
  const end = `${hoje.toISOString().split("T")[0]}T23:59:59`
  const inicio = new Date(hoje.getTime() - 4 * 24 * 60 * 60 * 1000)
  const begin = `${inicio.toISOString().split("T")[0]}T00:00:00`

  const palavrasChave = extractKeywords(empresa)

  const result = await fetchEffectiLicitacoes({ begin, end, pagina: 0, palavrasChave })
  if (result.error) return { oportunidades: [], analisadas: 0, error: result.error }

  const analisadas = result.licitacoes.length

  const oportunidades: Oportunidade[] = result.licitacoes
    .map((lic) => {
      const { score, motivo } = calcScore(empresa, lic)
      return { ...lic, score, scoreLabel: getScoreLabel(score), motivo }
    })
    .filter((o) => o.score >= 60)
    .sort((a, b) => b.score - a.score)

  return { oportunidades, analisadas }
}

// Converte "DD/MM/YYYY HH:MM:SS" ou "DD/MM/YYYY" para ISO 8601
function parseDateEffecti(dateStr: string | undefined): string | null {
  if (!dateStr) return null
  const parts = dateStr.split(" ")
  const dateParts = parts[0].split("/")
  if (dateParts.length !== 3) return null
  const [day, month, year] = dateParts
  const time = parts[1] ?? "00:00:00"
  return `${year}-${month}-${day}T${time}`
}

export async function salvarOportunidade(
  empresaId: string,
  licitacao: NormalizedLicitacao,
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

  // 1. Upsert na tabela licitacoes pelo source_id (ID numérico da Effecti)
  const { data: licRow, error: licError } = await supabase
    .from("licitacoes")
    .upsert(
      {
        source_id: String(licitacao.idLicitacao),
        orgao: licitacao.orgao,
        objeto: licitacao.objetoSemTags || licitacao.objeto,
        valor_estimado: licitacao.valorTotalEstimado || null,
        modalidade: licitacao.modalidade,
        uf: licitacao.uf?.substring(0, 2) || null,
        data_encerramento: parseDateEffecti(licitacao.dataFinalProposta),
        source_url: licitacao.url || null,
        status: "ativa",
      },
      { onConflict: "source_id" }
    )
    .select("id")
    .single()

  if (licError || !licRow) {
    return { error: "Erro ao registrar licitação: " + (licError?.message ?? "sem retorno") }
  }

  // 2. Upsert do match com o UUID real da licitação
  const { error: matchError } = await supabase.from("matches").upsert(
    {
      company_id: empresaId,
      licitacao_id: licRow.id,
      relevancia_score: score,
      status: "pendente",
    },
    { onConflict: "company_id,licitacao_id" }
  )

  if (matchError) return { error: "Erro ao salvar match: " + matchError.message }
  revalidatePath("/oportunidades")
  return { success: true }
}
