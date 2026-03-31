import { createClient } from "@/lib/supabase/server"
import { ClientesClient } from "./clientes-client"

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from("companies")
    .select("id, razao_social, cnpj, porte, cnae, email_contato, contato, ativo")
    .order("razao_social")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <p className="text-sm text-slate-500 mt-1">
          {companies?.length ?? 0} empresa{(companies?.length ?? 0) !== 1 ? "s" : ""} cadastrada{(companies?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>
      <ClientesClient companies={companies ?? []} />
    </div>
  )
}
