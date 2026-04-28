import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getImpersonatingUserId } from "@/lib/impersonation"
import { LicitacoesPerdidasClient } from "./licitacoes-perdidas-client"

export default async function LicitacoesPerdidasPage() {
  const impersonatingUserId = await getImpersonatingUserId()
  const supabase = await createClient()

  let userId: string | null = null

  if (impersonatingUserId) {
    userId = impersonatingUserId
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  }

  if (!userId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Licitações Perdidas</h1>
        <p className="text-slate-400">Faça login para ver as licitações perdidas.</p>
      </div>
    )
  }

  const service = createServiceClient()

  const { data: empresas } = await service
    .from("companies")
    .select("id, razao_social, cnpj, cnae")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("razao_social")

  const empresasList = empresas ?? []

  const dozeM = new Date()
  dozeM.setFullYear(dozeM.getFullYear() - 1)
  const dozeMAgo = dozeM.toISOString().split("T")[0]
  const hoje = new Date().toISOString().split("T")[0]

  const { data: licitacoes } = await service
    .from("licitacoes")
    .select("id, objeto, orgao, uf, modalidade, valor_estimado, data_encerramento, status")
    .or(`status.eq.encerrada,data_encerramento.lt.${hoje}`)
    .gte("data_encerramento", dozeMAgo)
    .not("data_encerramento", "is", null)
    .order("valor_estimado", { ascending: false })

  const licitacoesList = licitacoes ?? []

  return (
    <LicitacoesPerdidasClient
      empresas={empresasList}
      licitacoes={licitacoesList}
    />
  )
}
