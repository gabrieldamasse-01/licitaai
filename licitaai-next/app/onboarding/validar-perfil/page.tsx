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

  const { data: empresa } = await supabase
    .from("companies")
    .select("id, razao_social, porte, cnae")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!empresa) redirect("/onboarding")

  const { licitacoes } = await buscarRankingPreliminar(empresa.id)

  const palavras_chave = extrairKeywords({
    razao_social: empresa.razao_social,
    porte: empresa.porte,
    cnae: empresa.cnae ?? [],
  })

  const criteriosIniciais = {
    cnaes: empresa.cnae ?? [],
    palavras_chave: palavras_chave.slice(0, 10),
    ufs: [],
    faixa_valor_min: null,
    faixa_valor_max: null,
    modalidades: ["Pregão Eletrônico", "Dispensa", "Inexigibilidade"],
  }

  return (
    <ValidarPerfilClient
      companyId={empresa.id}
      licitacoes={licitacoes}
      criteriosIniciais={criteriosIniciais}
    />
  )
}
