import { createClient } from "@/lib/supabase/server"
import { DocumentosClient } from "./documentos-client"

export default async function DocumentosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: documents }, { data: companies }, { data: allDocumentTypes }] =
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
        .eq("user_id", user?.id ?? "")
        .order("razao_social"),
      supabase
        .from("document_types")
        .select("id, nome, categoria, camada, cnaes_aplicaveis")
        .order("nome"),
    ])

  // CNAEs de todas as empresas do usuário (primeiros 2 dígitos para comparação)
  const cnaesPrefixes = new Set<string>()
  for (const company of companies ?? []) {
    for (const cnae of (company.cnae ?? []) as string[]) {
      // ex: "4120-4/00" → "41", ou "4120400" → "41"
      const digits = cnae.replace(/\D/g, "")
      if (digits.length >= 2) cnaesPrefixes.add(digits.slice(0, 2))
    }
  }

  const documentTypes = (allDocumentTypes ?? []).filter(
    (dt) => !dt.camada || dt.camada === "geral" || dt.camada === "habilitacao"
  )

  // Tipos de nicho que se aplicam aos CNAEs das empresas do usuário
  const nichoTypes = (allDocumentTypes ?? []).filter((dt) => {
    if (dt.camada !== "nicho") return false
    if (!dt.cnaes_aplicaveis?.length) return true
    return (dt.cnaes_aplicaveis as string[]).some((c) => cnaesPrefixes.has(c))
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
        companies={(companies ?? []).map(({ id, razao_social }) => ({ id, razao_social }))}
        documentTypes={documentTypes}
        nichoTypes={nichoTypes}
        temNicho={nichoTypes.length > 0}
      />
    </div>
  )
}
