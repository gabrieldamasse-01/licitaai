import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getImpersonatingUserId } from "@/lib/impersonation"
import { PropostasClient } from "./propostas-client"

export default async function PropostasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const impersonatingUserId = await getImpersonatingUserId()
  const effectiveUserId = impersonatingUserId ?? user?.id

  if (!effectiveUserId) return null

  const service = createServiceClient()

  const { data: propostas } = await service
    .from("propostas_geradas")
    .select(`
      id,
      proposta_texto,
      created_at,
      licitacao_id,
      company_id,
      licitacoes(objeto, orgao, uf),
      companies(razao_social)
    `)
    .eq("user_id", effectiveUserId)
    .order("created_at", { ascending: false })

  type PropostaRow = {
    id: string
    proposta_texto: string
    created_at: string
    licitacao_id: string
    company_id: string
    licitacoes: { objeto: string | null; orgao: string | null; uf: string | null } | null
    companies: { razao_social: string } | null
  }

  return <PropostasClient propostas={(propostas ?? []) as unknown as PropostaRow[]} />
}
