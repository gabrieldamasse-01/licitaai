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
    { data: authData },
    { count: totalCompanies },
    { data: feedbacks },
    { data: companies },
  ] = await Promise.all([
    // Auth Admin API — acessa auth.users diretamente
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("companies").select("*", { count: "exact", head: true }),
    admin
      .from("feedback")
      .select("tipo, titulo, descricao, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    // Busca empresas para fazer join manual com os usuários
    admin
      .from("companies")
      .select("user_id, razao_social, cnpj, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  const authUsers = authData?.users ?? []
  const totalUsers = authUsers.length

  // Mapeia user_id → empresa para exibir na tabela
  const companyByUserId = Object.fromEntries(
    (companies ?? []).map((c) => [c.user_id, c]),
  )

  // Usuários mais recentes (últimos 15)
  const recentAuthUsers = [...authUsers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15)

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
          <p className="text-3xl font-bold text-white">{totalUsers}</p>
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

      {/* Tabela de usuários */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Usuários cadastrados</h2>
          <span className="text-xs text-slate-500">{totalUsers} no total</span>
        </div>
        {recentAuthUsers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Nenhum usuário ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {recentAuthUsers.map((u) => {
                  const company = companyByUserId[u.id]
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-slate-300">{u.email ?? "—"}</td>
                      <td className="px-5 py-3">
                        {company ? (
                          <span className="text-white font-medium">{company.razao_social}</span>
                        ) : (
                          <span className="text-slate-600 italic">Sem empresa</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 tabular-nums">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  )
}
