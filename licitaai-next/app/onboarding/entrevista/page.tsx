import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { criarOuBuscarEntrevista } from "./actions"
import { EntrevistaClient } from "./entrevista-client"

export default async function EntrevistaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const result = await criarOuBuscarEntrevista()

  if ("error" in result) redirect("/onboarding")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/40">
          <span className="text-xl font-black text-white">L</span>
        </div>
        <span className="text-lg font-bold text-white tracking-tight">LicitaAI</span>
      </div>

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl shadow-black/20 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Aprimorar perfil de licitações</h1>
          <p className="text-sm text-slate-500 mt-1">
            Responda algumas perguntas para que a IA encontre as melhores oportunidades para você.
          </p>
        </div>

        <EntrevistaClient
          entrevistaId={result.id}
          respostasIniciais={result.respostas}
        />
      </div>
    </div>
  )
}
