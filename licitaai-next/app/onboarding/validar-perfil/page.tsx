import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { extrairKeywords } from "@/lib/scoring"
import { ValidarPerfilClient } from "./validar-perfil-client"
import { buscarRankingPreliminar } from "./actions"

export default async function ValidarPerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: entrevista } = await supabase
    .from("entrevistas_onboarding")
    .select("id, perfil_gerado")
    .eq("user_id", user.id)
    .eq("status", "concluida")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!entrevista) redirect("/onboarding/entrevista")

  const { data: empresa } = await supabase
    .from("companies")
    .select("id, razao_social, porte, cnae")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!empresa) redirect("/onboarding")

  const { licitacoes } = await buscarRankingPreliminar(empresa.id)

  const perfil = entrevista.perfil_gerado as {
    cnaes_provaveis?: string[]
    palavras_chave?: string[]
    ufs_prioritarias?: string[]
    valor_min?: number | null
    valor_max?: number | null
    modalidades?: string[]
  } | null

  const palavras_chave = perfil?.palavras_chave?.length
    ? perfil.palavras_chave
    : extrairKeywords({ razao_social: empresa.razao_social, porte: empresa.porte, cnae: empresa.cnae ?? [] }).slice(0, 10)

  const criteriosIniciais = {
    cnaes: perfil?.cnaes_provaveis?.length ? perfil.cnaes_provaveis : (empresa.cnae ?? []),
    palavras_chave,
    ufs: perfil?.ufs_prioritarias ?? [],
    faixa_valor_min: perfil?.valor_min ?? null,
    faixa_valor_max: perfil?.valor_max ?? null,
    modalidades: perfil?.modalidades ?? ["Pregão Eletrônico", "Dispensa", "Inexigibilidade"],
  }

  return (
    <ValidarPerfilClient
      companyId={empresa.id}
      licitacoes={licitacoes}
      criteriosIniciais={criteriosIniciais}
    />
  )
}
