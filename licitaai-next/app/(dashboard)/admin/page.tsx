export const revalidate = 60

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/is-admin"
import { createServiceClient } from "@/lib/supabase/service"
import AdminClient from "./admin-client"
import AdminLoading from "./loading"

async function AdminConteudo({
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
  const trinta_dias_atras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sete_dias_atras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

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
    { count: totalPropostas },
    { count: totalLicitacoes },
    { count: totalLicitacoesAtivas },
    { data: ultimaSyncRaw },
    { count: errosSyncCount },
    { data: propostasTopRaw },
    { data: matchesTopRaw },
    { data: usuariosAtivosRaw },
    { data: leadsRaw },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 100 }),
    admin.from("companies").select("*", { count: "exact", head: true }),
    admin.from("matches").select("*", { count: "exact", head: true }),
    admin.from("documents").select("*", { count: "exact", head: true }),
    admin
      .from("feedback")
      .select("id, user_id, tipo, titulo, descricao, resolvido, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("admin_users").select("*").order("created_at", { ascending: false }),
    admin.from("companies").select("id, user_id, razao_social").limit(1000),
    admin.from("user_preferences").select("user_id, plano, avatar_url").limit(1000),
    admin
      .from("matches")
      .select("id, relevancia_score, created_at, companies!inner(razao_social), licitacoes!inner(objeto, orgao)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("portal_config").select("portal, ativo"),
    // Métricas de uso
    admin.from("propostas_geradas").select("*", { count: "exact", head: true }),
    admin.from("licitacoes").select("*", { count: "exact", head: true }),
    admin.from("licitacoes").select("*", { count: "exact", head: true }).eq("status", "ativa"),
    admin.from("licitacoes").select("updated_at").order("updated_at", { ascending: false }).limit(1),
    admin
      .from("agent_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "error")
      .gte("created_at", sete_dias_atras),
    admin
      .from("propostas_geradas")
      .select("user_id")
      .order("user_id")
      .limit(100),
    admin
      .from("matches")
      .select("companies!inner(user_id)")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("propostas_geradas")
      .select("user_id, created_at")
      .gte("created_at", trinta_dias_atras),
    admin
      .from("leads")
      .select("id, nome, email, empresa, status, origem, ultima_interacao, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ])

  const authUsers = authData?.users ?? []

  // Mapas auxiliares
  const companyByUserId = Object.fromEntries(
    (companies ?? []).map((c) => [c.user_id, c.razao_social as string]),
  )

  // Lista de companies para o seletor de cliente na aba Licitações
  const companiesList = (companies ?? [])
    .filter((c) => c.razao_social)
    .map((c) => ({ id: c.id as string, razao_social: c.razao_social as string }))
  const prefsByUserId = Object.fromEntries(
    (userPrefs ?? []).map((p) => [p.user_id, { plano: p.plano as string, avatar_url: p.avatar_url as string | undefined }]),
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
      plano: prefsByUserId[u.id]?.plano,
      avatar_url: prefsByUserId[u.id]?.avatar_url,
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
    comprasnet: (portalConfigRaw ?? []).find((p) => p.portal === "comprasnet")?.ativo ?? false,
  }

  // ── Métricas de uso ────────────────────────────────────────────────────────

  // Top 10 propostas por usuário
  const propostasPorUser: Record<string, number> = {}
  for (const p of propostasTopRaw ?? []) {
    const uid = p.user_id as string
    propostasPorUser[uid] = (propostasPorUser[uid] ?? 0) + 1
  }

  // Matches (licitações salvas) por usuário via companies.user_id
  const matchesPorUser: Record<string, number> = {}
  for (const m of matchesTopRaw ?? []) {
    const comp = m.companies as unknown as { user_id: string } | null
    if (comp?.user_id) {
      matchesPorUser[comp.user_id] = (matchesPorUser[comp.user_id] ?? 0) + 1
    }
  }

  // Usuários ativos (últimos 30 dias) — quem gerou proposta
  const usuariosAtivos30d = new Set<string>()
  for (const u of usuariosAtivosRaw ?? []) {
    usuariosAtivos30d.add(u.user_id as string)
  }

  // Montar tabela de usuários mais ativos (union de quem tem propostas ou matches)
  const todosUserIds = new Set([
    ...Object.keys(propostasPorUser),
    ...Object.keys(matchesPorUser),
  ])

  const usuariosMaisAtivos = Array.from(todosUserIds)
    .map((uid) => ({
      user_id: uid,
      email: emailByUserId[uid] ?? uid,
      propostas: propostasPorUser[uid] ?? 0,
      licitacoes_salvas: matchesPorUser[uid] ?? 0,
      ativo_30d: usuariosAtivos30d.has(uid),
    }))
    .sort((a, b) => b.propostas + b.licitacoes_salvas - (a.propostas + a.licitacoes_salvas))
    .slice(0, 10)

  const usageMetrics = {
    totalPropostas: totalPropostas ?? 0,
    totalLicitacoes: totalLicitacoes ?? 0,
    totalLicitacoesAtivas: totalLicitacoesAtivas ?? 0,
    ultimaSync: ultimaSyncRaw?.[0]?.updated_at as string | null ?? null,
    errosSyncCount: errosSyncCount ?? 0,
    usuariosMaisAtivos,
  }

  // ── WhatsApp Z-API ─────────────────────────────────────────────────────────
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)

  const [{ count: whatsappMensagensHoje }, zapiStatusRaw] = await Promise.all([
    admin
      .from("agent_logs")
      .select("*", { count: "exact", head: true })
      .eq("agent", "whatsapp")
      .eq("status", "success")
      .gte("created_at", inicioDia.toISOString()),
    process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN
      ? fetch(
          `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/status`,
          { headers: { "Client-Token": process.env.ZAPI_CLIENT_TOKEN ?? "" }, cache: "no-store" }
        )
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      : Promise.resolve(null),
  ])

  const zapiConectado = zapiStatusRaw?.connected === true || zapiStatusRaw?.status === "CONNECTED"

  return (
    <AdminClient
      initialTab={initialTab}
      metrics={metrics}
      clientes={clientes}
      feedbacks={feedbacks}
      licitacoes={licitacoes}
      time={time}
      portalConfig={portalConfig}
      usageMetrics={usageMetrics}
      whatsappMensagensHoje={whatsappMensagensHoje ?? 0}
      zapiConectado={zapiConectado}
      companies={companiesList}
      leads={(leadsRaw ?? []).map((l) => ({
        id: l.id as string,
        nome: l.nome as string,
        email: l.email as string,
        empresa: l.empresa as string | null,
        status: l.status as string,
        origem: l.origem as string,
        ultima_interacao: l.ultima_interacao as string | null,
        created_at: l.created_at as string,
      }))}
    />
  )
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminConteudo searchParams={searchParams} />
    </Suspense>
  )
}
