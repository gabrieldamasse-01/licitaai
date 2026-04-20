"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { calcularScore } from "@/lib/scoring"

export type LicitacaoRanking = {
  id: string
  orgao: string | null
  objeto: string | null
  valor_estimado: number | null
  modalidade: string | null
  uf: string | null
  data_encerramento: string | null
  source_url: string | null
  portal: string | null
  score: number
  scoreLabel: string
  motivo: string
}

export async function buscarRankingPreliminar(companyId: string): Promise<{
  licitacoes: LicitacaoRanking[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { licitacoes: [], error: "Não autenticado" }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id, razao_social, porte, cnae")
    .eq("id", companyId)
    .eq("user_id", user.id)
    .single()

  if (!empresa) return { licitacoes: [], error: "Empresa não encontrada" }

  const inicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const { data: licitacoes, error } = await supabase
    .from("licitacoes")
    .select("id, orgao, objeto, valor_estimado, modalidade, uf, data_encerramento, source_url, portal")
    .gte("updated_at", inicio.toISOString())
    .eq("status", "ativa")
    .not("objeto", "is", null)
    .order("updated_at", { ascending: false })
    .limit(300)

  if (error) return { licitacoes: [], error: error.message }

  const ranqueadas = (licitacoes ?? [])
    .map((lic) => {
      const { score, scoreLabel, motivo } = calcularScore(empresa, {
        objeto: lic.objeto ?? "",
        modalidade: lic.modalidade ?? "",
      })
      return { ...lic, score, scoreLabel, motivo }
    })
    .filter((l) => l.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return { licitacoes: ranqueadas }
}

export async function aprovarPerfil(
  companyId: string,
  criterios: {
    cnaes: string[]
    palavras_chave: string[]
    ufs: string[]
    faixa_valor_min: number | null
    faixa_valor_max: number | null
    modalidades: string[]
  }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("user_id", user.id)
    .single()

  if (!empresa) return { error: "Empresa não encontrada" }

  // Persistir CNAEs de volta em companies.cnae
  const { error: cnaeError } = await supabase
    .from("companies")
    .update({ cnae: criterios.cnaes })
    .eq("id", companyId)
    .eq("user_id", user.id)

  if (cnaeError) return { error: "Erro ao salvar CNAEs: " + cnaeError.message }

  const { error: insertError } = await supabase.from("perfis_validados").insert({
    company_id: companyId,
    user_id: user.id,
    criterios_busca: criterios,
    criterios_ranqueamento: { algoritmo: "scoring_v1", threshold: 70 },
    validado_em: new Date().toISOString(),
  })

  if (insertError) return { error: "Erro ao salvar perfil: " + insertError.message }

  await supabase.from("notifications").insert({
    user_id: user.id,
    tipo: "perfil_validado",
    titulo: "Perfil aprovado! ✅",
    mensagem: "Seu perfil de licitações foi validado. Acesse as oportunidades agora.",
    link: "/oportunidades",
  })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
