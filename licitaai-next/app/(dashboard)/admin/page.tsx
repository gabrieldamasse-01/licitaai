import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/is-admin"
import { createServiceClient } from "@/lib/supabase/service"
import AdminClient from "./admin-client"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Verificar permissão
  const adminOk = await isAdmin()
  if (!adminOk) redirect("/dashboard")

  const { tab } = await searchParams
  const initialTab = tab ?? "visao_geral"

  const admin = createServiceClient()

  // Buscar todos os dados em paralelo
  const [
    { data: authData },
    { count: totalCompanies },
    { count: totalMatches },
    { count: totalDocuments },
    { data: feedbacksRaw },
    { data: adminUsers },
    { data: companies },
    { data: userPrefs },
    { data: matchesRaw },
    { data: portalConfigRaw },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("companies").select("*", { count: "exact", head: true }),
    admin.from("matches").select("*", { count: "exact", head: true }),
    admin.from("documents").select("*", { count: "exact", head: true }),
    admin
      .from("feedback")
      .select("id, user_id, tipo, titulo, descricao, resolvido, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("admin_users").select("*").order("created_at", { ascending: false }),
    admin.from("companies").select("user_id, razao_social").limit(1000),
    admin.from("user_preferences").select("user_id, plano").limit(1000),
    admin
      .from("matches")
      .select("id, relevancia_score, created_at, companies!inner(razao_social), licitacoes!inner(objeto, orgao)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("portal_config").select("portal, ativo"),
  ])

  const authUsers = authData?.users ?? []

  // Mapas auxiliares
  const companyByUserId = Object.fromEntries(
    (companies ?? []).map((c) => [c.user_id, c.razao_social as string]),
  )
  const prefsByUserId = Object.fromEntries(
    (userPrefs ?? []).map((p) => [p.user_id, p.plano as string]),
  )
  const emailByUserId = Object.fromEntries(
    authUsers.map((u) => [u.id, u.email ?? ""]),
  )

  // Conjunto de e-mails dos administradores (para excluir da lista de clientes)
  const adminEmails = new Set(
    (adminUsers ?? []).map((a: Record<string, unknown>) => (a.email as string ?? "").toLowerCase())
  )

  // Montar lista de clientes — excluindo administradores
  const clientes = authUsers
    .filter((u) => !adminEmails.has((u.email ?? "").toLowerCase()))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      razao_social: companyByUserId[u.id],
      plano: prefsByUserId[u.id],
    }))

  // Montar feedbacks com email
  const feedbacks = (feedbacksRaw ?? []).map((f) => ({
    id: f.id as string,
    user_email: f.user_id ? emailByUserId[f.user_id as string] : undefined,
    tipo: f.tipo as string,
    titulo: f.titulo as string,
    descricao: f.descricao as string,
    resolvido: (f.resolvido as boolean) ?? false,
    created_at: f.created_at as string,
  }))

  // Montar licitações a partir dos matches com join
  const licitacoes = (matchesRaw ?? []).map((m: Record<string, unknown>) => {
    const comp = m.companies as { razao_social: string } | null
    const lic = m.licitacoes as { objeto: string; orgao: string } | null
    return {
      id: m.id as string,
      razao_social: comp?.razao_social ?? "—",
      objeto: lic?.objeto ?? "—",
      orgao: lic?.orgao ?? "—",
      relevancia_score: (m.relevancia_score as number) ?? 0,
      created_at: m.created_at as string,
    }
  })

  // Time (admin_users)
  const time = (adminUsers ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    user_id: a.user_id as string,
    email: a.email as string,
    nome: a.nome as string,
    cargo: a.cargo as string | null,
    ativo: (a.ativo as boolean) ?? false,
    created_at: a.created_at as string,
  }))

  // Métricas
  const metrics = {
    totalUsers: authUsers.length,
    totalCompanies: totalCompanies ?? 0,
    totalMatches: totalMatches ?? 0,
    totalDocuments: totalDocuments ?? 0,
    totalFeedbacks: feedbacks.length,
    totalAdmins: time.filter((m) => m.ativo).length,
  }

  const portalConfig = {
    effecti: (portalConfigRaw ?? []).find((p) => p.portal === "effecti")?.ativo ?? true,
    pncp: (portalConfigRaw ?? []).find((p) => p.portal === "pncp")?.ativo ?? false,
  }

  return (
    <AdminClient
      initialTab={initialTab}
      metrics={metrics}
      clientes={clientes}
      feedbacks={feedbacks}
      licitacoes={licitacoes}
      time={time}
      portalConfig={portalConfig}
    />
  )
}
