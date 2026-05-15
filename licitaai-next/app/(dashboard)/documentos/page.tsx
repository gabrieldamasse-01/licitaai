import { createClient } from "@/lib/supabase/server"
import { DocumentosClient } from "./documentos-client"
import { getUserPlan } from "@/lib/get-user-plan"
import { PlanoBloqueado } from "@/components/plano-bloqueado"
import { isPlanoPago } from "@/lib/plans"

export default async function DocumentosPage() {
  const plano = await getUserPlan()
  if (!isPlanoPago(plano)) return <PlanoBloqueado recurso="Documentos" />

  const supabase = await createClient()

  const [{ data: documents }, { data: companies }, { data: documentTypes }] =
    await Promise.all([
      supabase
        .from("documents")
        .select(
          "id, tipo, nome_arquivo, arquivo_url, data_emissao, data_validade, status, company_id, companies(razao_social)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id, razao_social, cnae")
        .eq("ativo", true)
        .order("razao_social"),
      supabase
        .from("document_types")
        .select("id, nome, categoria, camada, cnaes_aplicaveis")
        .order("nome"),
    ])

  // Coletar todas as divisões CNAE do usuário (2 primeiros dígitos)
  const cnaesDivisoes = new Set<string>()
  for (const company of companies ?? []) {
    for (const cnae of (company.cnae as string[] | null) ?? []) {
      const divisao = cnae.replace(/\D/g, "").substring(0, 2)
      if (divisao) cnaesDivisoes.add(divisao)
    }
  }

  // Filtrar tipos de nicho aplicáveis ao perfil do usuário
  const tiposNicho = (documentTypes ?? []).filter((dt) => {
    if (dt.camada !== "nicho") return false
    const cnaesDoc = (dt.cnaes_aplicaveis as string[] | null) ?? []
    return cnaesDoc.some((c) => cnaesDivisoes.has(c))
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Documentos</h1>
        <p className="text-sm text-slate-400 mt-1">
          {documents?.length ?? 0} documento{(documents?.length ?? 0) !== 1 ? "s" : ""} cadastrado{(documents?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>
      <DocumentosClient
        documents={documents ?? []}
        companies={(companies ?? []).map((c) => ({ id: c.id, razao_social: c.razao_social }))}
        documentTypes={documentTypes ?? []}
        tiposNicho={tiposNicho}
      />
    </div>
  )
}
