import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Shield, Users, MessageSquare, BarChart3 } from "lucide-react"

const ADMIN_EMAIL = "gabriel.damasse@mgnext.com"

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard")
  }

  const admin = getServiceClient()

  // Busca métricas em paralelo
  const [
    { count: totalUsers },
    { count: totalCompanies },
    { data: feedbacks },
    { data: recentUsers },
  ] = await Promise.all([
    admin.from("user_preferences").select("*", { count: "exact", head: true }),
    admin.from("companies").select("*", { count: "exact", head: true }),
    admin.from("feedback").select("tipo, titulo, descricao, created_at").order("created_at", { ascending: false }).limit(20),
    admin
      .from("companies")
      .select("razao_social, cnpj, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const tipoLabel: Record<string, string> = {
    bug: "🐛 Bug",
    sugestao: "💡 Sugestão",
    elogio: "❤️ Elogio",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin</h1>
          <p className="text-sm text-slate-400">Painel restrito — visão geral da plataforma</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-slate-400">Usuários</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalUsers ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-slate-400">Empresas</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalCompanies ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-5 w-5 text-violet-400" />
            <span className="text-sm text-slate-400">Feedbacks</span>
          </div>
          <p className="text-3xl font-bold text-white">{feedbacks?.length ?? 0}</p>
        </div>
      </div>

      {/* Feedbacks recentes */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-white">Feedbacks recentes</h2>
        </div>
        {!feedbacks || feedbacks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Nenhum feedback ainda.</p>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {feedbacks.map((f, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400">{tipoLabel[f.tipo] ?? f.tipo}</span>
                  <span className="text-xs text-slate-600">
                    {new Date(f.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">{f.titulo}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{f.descricao}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usuários recentes */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-white">Empresas cadastradas recentemente</h2>
        </div>
        {!recentUsers || recentUsers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Nenhuma empresa ainda.</p>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {recentUsers.map((c, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{c.razao_social}</p>
                  <p className="text-xs text-slate-500 font-mono">{c.cnpj}</p>
                </div>
                <span className="text-xs text-slate-600">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
