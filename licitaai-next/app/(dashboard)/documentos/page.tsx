import { createClient } from "@/lib/supabase/server"
import { DocumentosClient } from "./documentos-client"

export default async function DocumentosPage() {
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
        .select("id, razao_social")
        .eq("ativo", true)
        .order("razao_social"),
      supabase
        .from("document_types")
        .select("id, nome, categoria")
        .order("nome"),
    ])

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
        companies={companies ?? []}
        documentTypes={documentTypes ?? []}
      />
    </div>
  )
}
