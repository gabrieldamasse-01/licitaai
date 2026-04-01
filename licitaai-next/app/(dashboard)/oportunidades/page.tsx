import { createClient } from "@/lib/supabase/server"
import { OportunidadesClient } from "./oportunidades-client"
import type { Empresa } from "./actions"

export default async function OportunidadesPage() {
  const supabase = await createClient()

  const { data: empresas } = await supabase
    .from("companies")
    .select("id, razao_social, cnpj, porte, cnae")
    .eq("ativo", true)
    .order("razao_social")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Oportunidades</h1>
        <p className="text-sm text-slate-500 mt-1">
          Matches empresa × licitação com scoring por CNAE e perfil
        </p>
      </div>

      <OportunidadesClient empresas={(empresas ?? []) as Empresa[]} />
    </div>
  )
}
