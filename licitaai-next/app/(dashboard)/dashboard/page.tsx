import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getImpersonatingUserId } from "@/lib/impersonation"
import { Building2, FileText, Search, AlertTriangle, Clock, ArrowRight, Sparkles, Activity, ClipboardList, ShieldCheck, TrendingUp, TrendingDown, BarChart2, DollarSign } from "lucide-react"
import { GraficoLicitacoesPorUF, GraficoModalidades, GraficoLicitacoesPorDia } from "@/components/domain/dashboard-charts"
import Link from "next/link"
import { format, parseISO, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"

type CompanyRelation = { razao_social: string } | { razao_social: string }[] | null
type LicitacaoRelation = { objeto: string; orgao: string } | { objeto: string; orgao: string }[] | null

function getSaudacao(): string {
  const hora = parseInt(
    new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }),
    10,
  )
  if (hora >= 5 && hora < 12) return "Bom dia"
  if (hora >= 12 && hora < 18) return "Boa tarde"
  return "Boa noite"
}

function getRazaoSocial(companies: CompanyRelation): string {
  if (!companies) return "—"
  if (Array.isArray(companies)) return companies[0]?.razao_social ?? "—"
  return companies.razao_social
}

function getObjeto(licitacoes: LicitacaoRelation): string {
  if (!licitacoes) return "—"
  if (Array.isArray(licitacoes)) return licitacoes[0]?.objeto ?? "—"
  return licitacoes.objeto
}

function getOrgao(licitacoes: LicitacaoRelation): string {
  if (!licitacoes) return "—"
  if (Array.isArray(licitacoes)) return licitacoes[0]?.orgao ?? "—"
  return licitacoes.orgao
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function getDocStatusBadge(dataValidade: string | null) {
  if (!dataValidade) return { label: "Sem data", cls: "bg-slate-700 text-slate-400 border-slate-600" }
  const validade = new Date(dataValidade + "T00:00:00")
  const hoje = new Date()
  const em7 = new Date(); em7.setDate(hoje.getDate() + 7)
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30)
  if (validade < hoje) return { label: "Expirado", cls: "bg-red-950/50 text-red-400 border-red-800/50" }
  if (validade <= em7) return { label: "Crítico", cls: "bg-red-950/50 text-red-400 border-red-800/50" }
  if (validade <= em30) return { label: "Vencendo", cls: "bg-amber-950/50 text-amber-400 border-amber-800/50" }
  return { label: "Válido", cls: "bg-emerald-950/50 text-emerald-400 border-emerald-800/50" }
}

// ─── Helpers para buscar company_ids de um user ───────────────────────────────

async function getCompanyIds(userId: string): Promise<string[]> {
  const service = createServiceClient()
  const { data } = await service.from("companies").select("id").eq("user_id", userId)
  return (data ?? []).map((c) => c.id as string)
}

// ─── Engajamento ──────────────────────────────────────────────────────────────

async function getEngajamento(userId: string | null) {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const inicioMesStr = inicioMes.toISOString()

  if (userId) {
    const service = createServiceClient()
    const companyIds = await getCompanyIds(userId)

    if (companyIds.length === 0) {
      return { visualizadas: 0, salvas: 0, docsPct: 0, notifHorario: '08:00' }
    }

    const [visualizadas, salvas, docsTotal, docsValidos, prefs] = await Promise.all([
      service.from('matches').select('*', { count: 'exact', head: true }).in('company_id', companyIds).neq('status', 'novo').gte('updated_at', inicioMesStr),
      service.from('matches').select('*', { count: 'exact', head: true }).in('company_id', companyIds),
      service.from('documents').select('*', { count: 'exact', head: true }).in('company_id', companyIds),
      service.from('documents').select('*', { count: 'exact', head: true }).in('company_id', companyIds).eq('status', 'valido'),
      service.from('user_preferences').select('notif_config').eq('user_id', userId).single(),
    ])

    const totalDocs = docsTotal.count ?? 0
    const validosDocs = docsValidos.count ?? 0
    const docsPct = totalDocs > 0 ? Math.round((validosDocs / totalDocs) * 100) : 0
    const notifConfig = prefs.data?.notif_config as { horario?: string } | null
    const notifHorario = notifConfig?.horario ?? '08:00'

    return {
      visualizadas: visualizadas.count ?? 0,
      salvas: salvas.count ?? 0,
      docsPct,
      notifHorario,
    }
  }

  const supabase = await createClient()
  const [visualizadas, salvas, docsTotal, docsValidos, prefs] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }).neq('status', 'novo').gte('updated_at', inicioMesStr),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'valido'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('user_preferences').select('notif_config').single(),
  ])

  const totalDocs = docsTotal.count ?? 0
  const validosDocs = docsValidos.count ?? 0
  const docsPct = totalDocs > 0 ? Math.round((validosDocs / totalDocs) * 100) : 0
  const notifConfig = prefs.data?.notif_config as { horario?: string } | null
  const notifHorario = notifConfig?.horario ?? '08:00'

  return {
    visualizadas: visualizadas.count ?? 0,
    salvas: salvas.count ?? 0,
    docsPct,
    notifHorario,
  }
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

async function getMetrics(userId: string | null) {
  const hoje = new Date().toISOString().split("T")[0]
  const em30 = new Date(); em30.setDate(em30.getDate() + 30)
  const em30Str = em30.toISOString().split("T")[0]

  if (userId) {
    // Impersonando — usar service client com filtro explícito
    const service = createServiceClient()
    const companyIds = await getCompanyIds(userId)

    if (companyIds.length === 0) {
      return { totalClientes: 0, licitacoesSalvas: 0, documentosVencendo: 0, documentosExpirados: 0 }
    }

    const [companies, matches, docsVencendo, docsExpirados] = await Promise.all([
      service.from("companies").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("ativo", true),
      service.from("matches").select("*", { count: "exact", head: true }).in("company_id", companyIds),
      service.from("documents").select("*", { count: "exact", head: true }).in("company_id", companyIds).gte("data_validade", hoje).lte("data_validade", em30Str),
      service.from("documents").select("*", { count: "exact", head: true }).in("company_id", companyIds).lt("data_validade", hoje),
    ])

    return {
      totalClientes: companies.count ?? 0,
      licitacoesSalvas: matches.count ?? 0,
      documentosVencendo: docsVencendo.count ?? 0,
      documentosExpirados: docsExpirados.count ?? 0,
    }
  }

  // Normal — usar client com RLS
  const supabase = await createClient()
  const [companies, matches, docsVencendo, docsExpirados] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }).gte("data_validade", hoje).lte("data_validade", em30Str),
    supabase.from("documents").select("*", { count: "exact", head: true }).lt("data_validade", hoje),
  ])

  return {
    totalClientes: companies.count ?? 0,
    licitacoesSalvas: matches.count ?? 0,
    documentosVencendo: docsVencendo.count ?? 0,
    documentosExpirados: docsExpirados.count ?? 0,
  }
}

// ─── Documentos vencendo ──────────────────────────────────────────────────────

async function getDocumentosVencendo(userId: string | null) {
  const hoje = new Date().toISOString().split("T")[0]

  if (userId) {
    const service = createServiceClient()
    const companyIds = await getCompanyIds(userId)
    if (companyIds.length === 0) return []
    const { data } = await service
      .from("documents")
      .select("id, tipo, nome_arquivo, data_validade, status, companies(razao_social)")
      .in("company_id", companyIds)
      .gte("data_validade", hoje)
      .order("data_validade", { ascending: true })
      .limit(5)
    return data ?? []
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("documents")
    .select("id, tipo, nome_arquivo, data_validade, status, companies(razao_social)")
    .gte("data_validade", hoje)
    .order("data_validade", { ascending: true })
    .limit(5)
  return data ?? []
}

// ─── Últimas oportunidades ────────────────────────────────────────────────────

async function getUltimasOportunidades(userId: string | null) {
  if (userId) {
    const service = createServiceClient()
    const companyIds = await getCompanyIds(userId)
    if (companyIds.length === 0) return []
    const { data } = await service
      .from("matches")
      .select("id, licitacao_id, relevancia_score, status, created_at, licitacoes(objeto, orgao)")
      .in("company_id", companyIds)
      .order("created_at", { ascending: false })
      .limit(5)
    return data ?? []
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("matches")
    .select("id, licitacao_id, relevancia_score, status, created_at, licitacoes(objeto, orgao)")
    .order("created_at", { ascending: false })
    .limit(5)
  return data ?? []
}

// ─── Entrevista de perfil ─────────────────────────────────────────────────────

async function getEntrevistaConcluida(userId: string | null): Promise<boolean> {
  if (userId) {
    const { data } = await createServiceClient()
      .from("entrevistas_onboarding")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "concluida")
      .limit(1)
      .maybeSingle()
    return data !== null
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from("entrevistas_onboarding")
    .select("id")
    .eq("status", "concluida")
    .limit(1)
    .maybeSingle()
  return data !== null
}

// ─── Perfil validado ──────────────────────────────────────────────────────────

async function getPerfilValidado(userId: string | null): Promise<boolean> {
  if (userId) {
    const { data } = await createServiceClient()
      .from("perfis_validados")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()
    return data !== null
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from("perfis_validados")
    .select("id")
    .limit(1)
    .maybeSingle()
  return data !== null
}

// ─── Métricas de mercado (tabela licitacoes — sem filtro de usuário) ──────────

async function getMetricasMercado() {
  const service = createServiceClient()

  const trintaDiasAtras = subDays(new Date(), 30).toISOString().split("T")[0]

  const [
    porUFRaw,
    porModalidadeRaw,
    porDiaRaw,
    valorTotal,
    ativas,
    total,
  ] = await Promise.all([
    // Top 10 UFs
    service
      .from("licitacoes")
      .select("uf")
      .not("uf", "is", null)
      .neq("uf", ""),

    // Por modalidade
    service
      .from("licitacoes")
      .select("modalidade")
      .not("modalidade", "is", null)
      .neq("modalidade", ""),

    // Por dia (últimos 30 dias)
    service
      .from("licitacoes")
      .select("data_publicacao")
      .gte("data_publicacao", trintaDiasAtras)
      .not("data_publicacao", "is", null),

    // Valor total estimado das ativas
    service
      .from("licitacoes")
      .select("valor_estimado")
      .eq("status", "ativa")
      .not("valor_estimado", "is", null),

    // Contagem ativas
    service
      .from("licitacoes")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativa"),

    // Contagem total
    service
      .from("licitacoes")
      .select("*", { count: "exact", head: true }),
  ])

  // Agrupa UFs
  const ufMap = new Map<string, number>()
  for (const row of porUFRaw.data ?? []) {
    const uf = (row.uf as string).toUpperCase().trim()
    ufMap.set(uf, (ufMap.get(uf) ?? 0) + 1)
  }
  const dadosUF = [...ufMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([uf, total]) => ({ uf, total }))

  // Agrupa modalidades
  const modMap = new Map<string, number>()
  for (const row of porModalidadeRaw.data ?? []) {
    const mod = (row.modalidade as string).trim()
    if (mod) modMap.set(mod, (modMap.get(mod) ?? 0) + 1)
  }
  const dadosModalidade = [...modMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([modalidade, total]) => ({ modalidade, total }))

  // Agrupa por dia (últimos 30 dias)
  const diaMap = new Map<string, number>()
  for (const row of porDiaRaw.data ?? []) {
    const dia = (row.data_publicacao as string).slice(0, 10)
    diaMap.set(dia, (diaMap.get(dia) ?? 0) + 1)
  }
  const dadosDia: { dia: string; total: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i).toISOString().split("T")[0]
    const label = format(new Date(d + "T12:00:00"), "dd/MM", { locale: ptBR })
    dadosDia.push({ dia: label, total: diaMap.get(d) ?? 0 })
  }

  // Valor total estimado
  const somatorio = (valorTotal.data ?? []).reduce((acc, row) => {
    return acc + (Number(row.valor_estimado) || 0)
  }, 0)

  const totalLic = total.count ?? 0
  const totalAtivas = ativas.count ?? 0
  const pctAtivas = totalLic > 0 ? Math.round((totalAtivas / totalLic) * 100) : 0

  return {
    dadosUF,
    dadosModalidade,
    dadosDia,
    valorTotalEstimado: somatorio,
    totalAtivas,
    totalLicitacoes: totalLic,
    pctAtivas,
  }
}

// ─── Metric cards config ──────────────────────────────────────────────────────

const metricCards = [
  {
    key: "totalClientes" as const,
    title: "Clientes Ativos",
    description: "Empresas cadastradas",
    icon: Building2,
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    iconColor: "text-white",
  },
  {
    key: "licitacoesSalvas" as const,
    title: "Licitações Salvas",
    description: "Total de matches",
    icon: Search,
    iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-500",
    iconColor: "text-white",
  },
  {
    key: "documentosVencendo" as const,
    title: "Docs. Vencendo",
    description: "Vencem em 30 dias",
    icon: Clock,
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-500",
    iconColor: "text-white",
  },
  {
    key: "documentosExpirados" as const,
    title: "Docs. Expirados",
    description: "Requer renovação",
    icon: AlertTriangle,
    iconBg: "bg-gradient-to-br from-red-400 to-red-500",
    iconColor: "text-white",
  },
]

// ─── Licitações perdidas (últimos 30 dias) ────────────────────────────────────

async function getLicitacoesPerdidas30d() {
  const service = createServiceClient()
  const hoje = new Date().toISOString().split("T")[0]
  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
  const inicio = trintaDiasAtras.toISOString().split("T")[0]

  const [count, valor] = await Promise.all([
    service
      .from("licitacoes")
      .select("*", { count: "exact", head: true })
      .or(`status.eq.encerrada,data_encerramento.lt.${hoje}`)
      .gte("data_encerramento", inicio)
      .not("data_encerramento", "is", null),
    service
      .from("licitacoes")
      .select("valor_estimado")
      .or(`status.eq.encerrada,data_encerramento.lt.${hoje}`)
      .gte("data_encerramento", inicio)
      .not("data_encerramento", "is", null)
      .not("valor_estimado", "is", null),
  ])

  const totalValor = (valor.data ?? []).reduce((acc, r) => acc + (Number(r.valor_estimado) || 0), 0)
  return { count: count.count ?? 0, totalValor }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // Verifica se admin está impersonando um cliente
  const impersonatingUserId = await getImpersonatingUserId()

  const [metrics, documentosVencendo, ultimasOportunidades, engajamento, entrevistaConcluida, perfilValidado, mercado, perdidas30d] = await Promise.all([
    getMetrics(impersonatingUserId),
    getDocumentosVencendo(impersonatingUserId),
    getUltimasOportunidades(impersonatingUserId),
    getEngajamento(impersonatingUserId),
    getEntrevistaConcluida(impersonatingUserId),
    getPerfilValidado(impersonatingUserId),
    getMetricasMercado(),
    getLicitacoesPerdidas30d(),
  ])

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {getSaudacao()}!{" "}
            <span className="text-sm font-medium text-slate-400 block sm:inline sm:ml-2">
              Hoje é {formatDate(new Date().toISOString().split("T")[0])}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Aqui está o resumo da sua operação hoje.</p>
        </div>
        <Link
          href="/oportunidades"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95 whitespace-nowrap"
        >
          Ver Oportunidades
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metricCards.map(({ key, title, description, icon: Icon, iconBg, iconColor }) => (
          <div
            key={key}
            className="group relative overflow-hidden rounded-2xl p-4 md:p-5 transition-all duration-300 backdrop-blur-xl hover:bg-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs md:text-sm font-medium text-slate-400">{title}</p>
                <div className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl md:rounded-2xl shadow-sm ${iconBg}`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {metrics[key].toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Visão Geral do Mercado ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex bg-blue-900/30 p-1.5 rounded-lg">
            <BarChart2 className="h-4 w-4 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Visão Geral do Mercado</h2>
          <span className="text-xs text-slate-500">· dados em tempo real</span>
        </div>

        {/* Cards de métricas de mercado */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
          {/* Valor total estimado */}
          <div
            className="rounded-2xl p-4 md:p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs font-medium text-slate-400">Valor Total Estimado</p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-white leading-tight">
              {mercado.valorTotalEstimado > 0
                ? mercado.valorTotalEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                : "—"}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Licitações ativas no sistema</p>
          </div>

          {/* Licitações ativas */}
          <div
            className="rounded-2xl p-4 md:p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs font-medium text-slate-400">Licitações Ativas</p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Search className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-white leading-tight">
              {mercado.totalAtivas.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              de {mercado.totalLicitacoes.toLocaleString("pt-BR")} no total
            </p>
          </div>

          {/* Taxa de encerramento */}
          <div
            className="rounded-2xl p-4 md:p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs font-medium text-slate-400">Taxa de Ativas</p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`text-xl font-bold leading-tight ${mercado.pctAtivas >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
              {mercado.pctAtivas}%
            </p>
            <p className="text-[10px] text-slate-500 mt-1">do total ainda em aberto</p>
          </div>
        </div>

        {/* Gráficos: UF + Modalidade */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 mb-4">
          {/* Gráfico UF — 2/3 */}
          <div
            className="xl:col-span-2 rounded-2xl p-5 md:p-6 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}
          >
            <h3 className="text-sm font-semibold text-white mb-1">Licitações por UF</h3>
            <p className="text-xs text-slate-500 mb-4">Top 10 estados com mais licitações</p>
            {mercado.dadosUF.length > 0
              ? <GraficoLicitacoesPorUF dados={mercado.dadosUF} />
              : <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">Sem dados suficientes</div>
            }
          </div>

          {/* Gráfico Modalidade — 1/3 */}
          <div
            className="rounded-2xl p-5 md:p-6 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}
          >
            <h3 className="text-sm font-semibold text-white mb-1">Por Modalidade</h3>
            <p className="text-xs text-slate-500 mb-4">Distribuição das modalidades</p>
            {mercado.dadosModalidade.length > 0
              ? <GraficoModalidades dados={mercado.dadosModalidade} />
              : <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">Sem dados suficientes</div>
            }
          </div>
        </div>

        {/* Gráfico por dia — linha inteira */}
        <div
          className="rounded-2xl p-5 md:p-6 backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}
        >
          <h3 className="text-sm font-semibold text-white mb-1">Inserções por Dia</h3>
          <p className="text-xs text-slate-500 mb-4">Licitações adicionadas nos últimos 30 dias</p>
          <GraficoLicitacoesPorDia dados={mercado.dadosDia} />
        </div>
      </div>

      {/* Documentos Vencendo + Últimas Oportunidades */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Documentos com Vencimento Próximo */}
        <div className="rounded-2xl p-5 md:p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-amber-900/30 p-1.5 rounded-lg">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Documentos com Vencimento Próximo</h2>
            </div>
            <Link
              href="/documentos"
              className="group flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 shrink-0"
            >
              Ver todos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {documentosVencendo.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-xl border border-dashed border-white/15">
              <div className="bg-white/10 p-3 rounded-2xl shadow-sm mb-3">
                <FileText className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">Nenhum documento vencendo</p>
              <p className="text-xs text-slate-500 mt-1">Documentos com validade próxima aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {documentosVencendo.map((doc) => {
                const badge = getDocStatusBadge(doc.data_validade)
                const company = getRazaoSocial((doc as { companies: CompanyRelation }).companies)
                const isUrgent = badge.label === "Crítico" || badge.label === "Expirado"

                return (
                  <li
                    key={doc.id}
                    className={`flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ${
                      isUrgent ? "opacity-90" : ""
                    }`}
                  >
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <p className="truncate text-sm font-semibold text-white">{doc.tipo}</p>
                      <p className="truncate text-xs text-slate-400">
                        {company} · {formatDate(doc.data_validade)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Últimas Oportunidades Salvas */}
        <div className="rounded-2xl p-5 md:p-6 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-blue-900/30 p-1.5 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Últimas Oportunidades Salvas</h2>
            </div>
            <Link
              href="/oportunidades"
              className="group flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 shrink-0"
            >
              Ver todas <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {ultimasOportunidades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-xl border border-dashed border-white/15">
              <div className="bg-white/10 p-3 rounded-2xl shadow-sm mb-3">
                <Sparkles className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">Nenhuma oportunidade salva</p>
              <p className="text-xs text-slate-500 mt-1">Licitações salvas aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {ultimasOportunidades.map((match) => {
                const licitacao = (match as { licitacoes: LicitacaoRelation }).licitacoes
                const objeto = getObjeto(licitacao)
                const orgao = getOrgao(licitacao)
                const titulo = objeto !== "—" ? objeto : `Licitação #${match.licitacao_id}`

                return (
                  <li key={match.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <p className="line-clamp-2 text-sm font-semibold text-white leading-snug">{titulo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="truncate text-xs text-slate-400">{orgao}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                        <p className="text-xs text-slate-500 shrink-0">
                          {formatDate((match.created_at as string).split("T")[0])}
                        </p>
                      </div>
                    </div>
                    {match.relevancia_score != null && match.relevancia_score > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-violet-400 bg-violet-900/30 border border-violet-800/50 px-2 py-0.5 rounded-full">
                        {match.relevancia_score}%
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>

      {/* Card Perfil de Licitações */}
      <div className="rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          entrevistaConcluida ? "bg-emerald-900/50" : "bg-blue-900/50"
        }`}>
          <ClipboardList className={`h-6 w-6 ${entrevistaConcluida ? "text-emerald-400" : "text-blue-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-base font-semibold text-white">Perfil de Licitações</h2>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
              entrevistaConcluida
                ? "bg-emerald-900/50 text-emerald-400 border-emerald-700/50"
                : "bg-amber-900/50 text-amber-400 border-amber-700/50"
            }`}>
              {entrevistaConcluida ? "Concluído" : "Pendente"}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Responda 8 perguntas e nossa IA otimiza suas oportunidades
          </p>
        </div>
        <Link
          href="/onboarding/entrevista"
          className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-95 whitespace-nowrap ${
            entrevistaConcluida
              ? "bg-emerald-700 hover:bg-emerald-600 shadow-lg shadow-emerald-900/30"
              : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30"
          }`}
        >
          {entrevistaConcluida ? "Refazer entrevista" : "Iniciar entrevista"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Card Validar Perfil — visível somente quando entrevista concluída mas perfil não validado */}
      {entrevistaConcluida && !perfilValidado && (
        <div className="rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-900/50">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-semibold text-white">Valide seu perfil</h2>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold border bg-amber-900/50 text-amber-400 border-amber-700/50">
                Ação necessária
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Confirme os critérios de busca e ajuste os pesos de ranqueamento para resultados mais precisos.
            </p>
          </div>
          <Link
            href="/onboarding/validar-perfil"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30 transition-all active:scale-95 whitespace-nowrap"
          >
            Validar agora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Card Licitações Perdidas */}
      <div className="rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-950/60 border border-red-800/40">
          <TrendingDown className="h-6 w-6 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h2 className="text-base font-semibold text-white">Oportunidades perdidas</h2>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold border bg-red-950/50 text-red-400 border-red-800/50">
              Últimos 30 dias
            </span>
          </div>
          <p className="text-sm text-slate-400">
            <span className="text-2xl font-bold text-red-400 mr-1">{perdidas30d.count.toLocaleString("pt-BR")}</span>
            licitações encerradas
            {perdidas30d.totalValor > 0 && (
              <> · <span className="font-semibold text-red-300">{perdidas30d.totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</span> em contratos</>
            )}
          </p>
        </div>
        <Link
          href="/licitacoes-perdidas"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-red-700 hover:bg-red-600 shadow-lg shadow-red-900/30 transition-all active:scale-95 whitespace-nowrap"
        >
          Ver detalhes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Card de Engajamento */}
      <div className="rounded-2xl p-5 md:p-6 backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: "16px" }}>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex bg-violet-900/30 p-1.5 rounded-lg">
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Seu engajamento</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-white">{engajamento.visualizadas}</p>
            <p className="text-xs text-slate-400 mt-1">Licitações visualizadas este mês</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-white">{engajamento.salvas}</p>
            <p className="text-xs text-slate-400 mt-1">Oportunidades salvas</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className={`text-2xl font-bold ${engajamento.docsPct >= 80 ? 'text-emerald-400' : engajamento.docsPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {engajamento.docsPct}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Documentos em dia</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{engajamento.notifHorario}</p>
            <p className="text-xs text-slate-400 mt-1">Próximo alerta diário</p>
          </div>
        </div>
      </div>

    </div>
  )
}
