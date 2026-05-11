import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getImpersonatingUserId } from "@/lib/impersonation"
import { Building2, FileText, Search, AlertTriangle, Clock, ArrowRight, Sparkles, Activity, ClipboardList, ShieldCheck, TrendingUp } from "lucide-react"
import { GraficoDashboard } from "@/components/domain/grafico-dashboard"
import { GraficoMonitoramento } from "@/components/domain/grafico-monitoramento"
import type { DadosMonitoramento } from "@/components/domain/grafico-monitoramento"
import Link from "next/link"
import { format, parseISO } from "date-fns"
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}K`
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
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

// ─── Métricas ─────────────────────────────────────────────────────────────────

async function getMetrics(userId: string | null) {
  const hoje = new Date().toISOString().split("T")[0]
  const em30 = new Date(); em30.setDate(em30.getDate() + 30)
  const em30Str = em30.toISOString().split("T")[0]

  if (userId) {
    const service = createServiceClient()
    const companyIds = await getCompanyIds(userId)

    if (companyIds.length === 0) {
      return { totalClientes: 0, licitacoesSalvas: 0, documentosVencendo: 0, documentosExpirados: 0, valorTotal: 0 }
    }

    const [companies, matches, docsVencendo, docsExpirados] = await Promise.all([
      service.from("companies").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("ativo", true),
      service.from("matches").select("id, licitacoes(valor_estimado)").in("company_id", companyIds),
      service.from("documents").select("*", { count: "exact", head: true }).in("company_id", companyIds).gte("data_validade", hoje).lte("data_validade", em30Str),
      service.from("documents").select("*", { count: "exact", head: true }).in("company_id", companyIds).lt("data_validade", hoje),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valorTotal = (matches.data ?? []).reduce((acc: number, m: any) => {
      const lics = Array.isArray(m.licitacoes) ? m.licitacoes : m.licitacoes ? [m.licitacoes] : []
      return acc + lics.reduce((s: number, l: { valor_estimado: number | null }) => s + (l.valor_estimado ?? 0), 0)
    }, 0)

    return {
      totalClientes: companies.count ?? 0,
      licitacoesSalvas: matches.data?.length ?? 0,
      documentosVencendo: docsVencendo.count ?? 0,
      documentosExpirados: docsExpirados.count ?? 0,
      valorTotal,
    }
  }

  const supabase = await createClient()
  const [companies, matches, docsVencendo, docsExpirados] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("matches").select("id, licitacoes(valor_estimado)"),
    supabase.from("documents").select("*", { count: "exact", head: true }).gte("data_validade", hoje).lte("data_validade", em30Str),
    supabase.from("documents").select("*", { count: "exact", head: true }).lt("data_validade", hoje),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valorTotal = (matches.data ?? []).reduce((acc: number, m: any) => {
    const lics = Array.isArray(m.licitacoes) ? m.licitacoes : m.licitacoes ? [m.licitacoes] : []
    return acc + lics.reduce((s: number, l: { valor_estimado: number | null }) => s + (l.valor_estimado ?? 0), 0)
  }, 0)

  return {
    totalClientes: companies.count ?? 0,
    licitacoesSalvas: matches.data?.length ?? 0,
    documentosVencendo: docsVencendo.count ?? 0,
    documentosExpirados: docsExpirados.count ?? 0,
    valorTotal,
  }
}

// ─── Gráfico: matches por mês (últimos 6) ─────────────────────────────────────

async function getMatchesPorMes(userId: string | null) {
  const hoje = new Date()
  const sixMonthsAgo = new Date(hoje)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  let rawMatches: { created_at: string }[] = []

  if (userId) {
    const service = createServiceClient()
    const companyIds = await getCompanyIds(userId)
    if (companyIds.length > 0) {
      const { data } = await service
        .from("matches")
        .select("created_at")
        .in("company_id", companyIds)
        .gte("created_at", sixMonthsAgo.toISOString())
      rawMatches = data ?? []
    }
  } else {
    const supabase = await createClient()
    const { data } = await supabase
      .from("matches")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
    rawMatches = data ?? []
  }

  const por_mes: Record<string, number> = {}
  for (const m of rawMatches) {
    const d = new Date(m.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    por_mes[key] = (por_mes[key] ?? 0) + 1
  }

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje)
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
    return { mes: mes.charAt(0).toUpperCase() + mes.slice(1), total: por_mes[key] ?? 0 }
  })
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
      .select("id, licitacao_id, relevancia_score, status, created_at, licitacoes(objeto, orgao, valor_estimado)")
      .in("company_id", companyIds)
      .order("created_at", { ascending: false })
      .limit(5)
    return data ?? []
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("matches")
    .select("id, licitacao_id, relevancia_score, status, created_at, licitacoes(objeto, orgao, valor_estimado)")
    .order("created_at", { ascending: false })
    .limit(5)
  return data ?? []
}

// ─── Dados de monitoramento (gráfico financeiro) ──────────────────────────────

async function getDadosMonitoramento(userId: string | null): Promise<DadosMonitoramento> {
  const CORES = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"]

  const fetchMatches = async () => {
    if (userId) {
      const service = createServiceClient()
      const companyIds = await getCompanyIds(userId)
      if (companyIds.length === 0) return []
      const { data } = await service
        .from("matches")
        .select("created_at, licitacoes(valor_estimado, modalidade)")
        .in("company_id", companyIds)
      return data ?? []
    }
    const supabase = await createClient()
    const { data } = await supabase
      .from("matches")
      .select("created_at, licitacoes(valor_estimado, modalidade)")
    return data ?? []
  }

  const fetchTotalArea = async () => {
    if (userId) {
      const service = createServiceClient()
      const { count } = await service.from("licitacoes").select("*", { count: "exact", head: true })
      return count ?? 0
    }
    const supabase = await createClient()
    const { count } = await supabase.from("licitacoes").select("*", { count: "exact", head: true })
    return count ?? 0
  }

  const [matchesRaw, totalArea] = await Promise.all([fetchMatches(), fetchTotalArea()])

  let valorTotal = 0
  const porModalidade: Record<string, number> = {}
  const porMes: Record<string, number> = {}

  for (const m of matchesRaw) {
    const lic = Array.isArray(m.licitacoes) ? m.licitacoes[0] : m.licitacoes
    const valor = (lic as { valor_estimado?: number } | null)?.valor_estimado ?? 0
    const modalidade = (lic as { modalidade?: string } | null)?.modalidade ?? "Outros"
    valorTotal += valor
    porModalidade[modalidade] = (porModalidade[modalidade] ?? 0) + valor

    const mes = m.created_at
      ? new Date(m.created_at as string).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      : "?"
    porMes[mes] = (porMes[mes] ?? 0) + valor
  }

  const entradasModalidade = Object.entries(porModalidade).sort((a, b) => b[1] - a[1])
  const top5 = entradasModalidade.slice(0, 5)
  const resto = entradasModalidade.slice(5).reduce((acc, [, v]) => acc + v, 0)
  const pizza = [
    ...top5.map(([area, valor], i) => ({ area, valor, cor: CORES[i] })),
    ...(resto > 0 ? [{ area: "Outros", valor: resto, cor: "#475569" }] : []),
  ]

  const barras = Object.entries(porMes)
    .slice(-6)
    .map(([mes, valor]) => ({ mes, valor }))

  if (barras.length === 0) {
    const meses = ["Out", "Nov", "Dez", "Jan", "Fev", "Mar"]
    meses.forEach((mes) => barras.push({ mes, valor: 0 }))
  }

  return {
    valorTotalMonitorado: valorTotal,
    totalLicitacoesArea: totalArea,
    totalLicitacoesSalvas: matchesRaw.length,
    barras,
    pizza: pizza.length > 0 ? pizza : [{ area: "Sem dados", valor: 1, cor: "#475569" }],
  }
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

// ─── Engajamento ──────────────────────────────────────────────────────────────

async function getEngajamento(userId: string | null) {
  // Simulação de dados de engajamento
  return {
    visualizadas: 42,
    salvas: 12,
    docsPct: 85,
    notifHorario: "09:00",
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
    format: (v: number) => v.toLocaleString("pt-BR"),
  },
  {
    key: "licitacoesSalvas" as const,
    title: "Licitações Salvas",
    description: "Total de matches",
    icon: Search,
    iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-500",
    iconColor: "text-white",
    format: (v: number) => v.toLocaleString("pt-BR"),
  },
  {
    key: "documentosVencendo" as const,
    title: "Docs. Vencendo",
    description: "Vencem em 30 dias",
    icon: Clock,
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-500",
    iconColor: "text-white",
    format: (v: number) => v.toLocaleString("pt-BR"),
  },
  {
    key: "documentosExpirados" as const,
    title: "Docs. Expirados",
    description: "Requer renovação",
    icon: AlertTriangle,
    iconBg: "bg-gradient-to-br from-red-400 to-red-500",
    iconColor: "text-white",
    format: (v: number) => v.toLocaleString("pt-BR"),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const impersonatingUserId = await getImpersonatingUserId()

  const [metrics, matchesPorMes, documentosVencendo, ultimasOportunidades, engajamento, entrevistaConcluida, perfilValidado, dadosMonitoramento] = await Promise.all([
    getMetrics(impersonatingUserId),
    getMatchesPorMes(impersonatingUserId),
    getDocumentosVencendo(impersonatingUserId),
    getUltimasOportunidades(impersonatingUserId),
    getEngajamento(impersonatingUserId),
    getEntrevistaConcluida(impersonatingUserId),
    getPerfilValidado(impersonatingUserId),
    getDadosMonitoramento(impersonatingUserId),
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all active:scale-95 whitespace-nowrap"
        >
          Ver Oportunidades
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metricCards.map(({ key, title, description, icon: Icon, iconBg, iconColor, format }) => (
          <div
            key={key}
            className="group relative overflow-hidden rounded-2xl p-4 md:p-5 shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] backdrop-blur-[4px]"
            style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs md:text-sm font-medium text-slate-400">{title}</p>
                <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-2xl shadow-md ${iconBg}`}>
                  <Icon className={`h-5 w-5 md:h-6 md:w-6 ${iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  {format(metrics[key])}
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monitoramento financeiro */}
      <GraficoMonitoramento dados={dadosMonitoramento} />

      {/* Banner: Valor Total das Licitações (Se houver) */}
      {metrics.valorTotal > 0 && (
        <div
          className="rounded-2xl border border-blue-500/20 p-5 md:p-6 flex items-center gap-5 backdrop-blur-[4px]"
          style={{ background: "rgba(30,41,59,0.7)" }}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-900/40">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Valor Total Monitorado</p>
            <p className="text-3xl md:text-4xl font-black text-white mt-0.5">
              {formatCurrency(metrics.valorTotal)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Soma das licitações salvas com valor estimado</p>
          </div>
        </div>
      )}

      {/* Gráfico de Oportunidades */}
      <div className="rounded-2xl border border-white/[0.07] p-6 shadow-sm backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.7)" }}>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-white">Oportunidades Salvas por Mês</h2>
          <p className="text-xs text-slate-500 mt-0.5">Últimos 6 meses · dados reais</p>
        </div>
        <GraficoDashboard data={matchesPorMes} />
      </div>

      {/* Documentos Vencendo + Últimas Oportunidades */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Documentos com Vencimento Próximo */}
        <div className="rounded-2xl border border-white/[0.07] p-5 md:p-6 shadow-sm backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.7)" }}>
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
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-white/[0.06] mb-3">
                <FileText className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Nenhum documento vencendo</p>
              <p className="text-xs text-slate-500 mt-1">Documentos com validade próxima aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-white/[0.05]">
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
        <div className="rounded-2xl border border-white/[0.07] p-5 md:p-6 shadow-sm backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.7)" }}>
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
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-white/[0.06] mb-3">
                <Sparkles className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Nenhuma oportunidade salva</p>
              <p className="text-xs text-slate-500 mt-1">Licitações salvas aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-white/[0.05]">
              {ultimasOportunidades.map((match) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const licitacao = (match as any).licitacoes
                const lics = Array.isArray(licitacao) ? licitacao : licitacao ? [licitacao] : []
                const lic = lics[0]
                const objeto = lic?.objeto ?? "—"
                const orgao = lic?.orgao ?? "—"
                const valor = lic?.valor_estimado ?? null
                const titulo = objeto !== "—" ? objeto : `Licitação #${match.licitacao_id}`

                return (
                  <li key={match.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <p className="line-clamp-2 text-sm font-semibold text-white leading-snug">{titulo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p className="truncate text-xs text-slate-400">{orgao}</p>
                        {valor && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                            <p className="text-xs text-blue-400 font-medium shrink-0">{formatCurrency(valor)}</p>
                          </>
                        )}
                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                        <p className="text-xs text-slate-500 shrink-0">
                          {formatDate((match.created_at as string).split("T")[0])}
                        </p>
                      </div>
                    </div>
                    {match.relevancia_score != null && match.relevancia_score > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-blue-400 bg-blue-900/30 border border-blue-800/50 px-2 py-0.5 rounded-full">
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
      <div className={`rounded-2xl border p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 ${
        entrevistaConcluida
          ? "border-emerald-800/50 bg-emerald-950/30"
          : "border-blue-800/50 bg-blue-950/30"
      }`}>
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

      {/* Card Validar Perfil */}
      {entrevistaConcluida && !perfilValidado && (
        <div className="rounded-2xl border border-amber-800/50 bg-amber-950/30 p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
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

      {/* Card de Engajamento */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 md:p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex bg-blue-900/30 p-1.5 rounded-lg">
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Seu engajamento</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-700/50 p-4 text-center">
            <p className="text-2xl font-bold text-white">{engajamento.visualizadas}</p>
            <p className="text-xs text-slate-400 mt-1">Licitações visualizadas este mês</p>
          </div>
          <div className="rounded-xl bg-slate-700/50 p-4 text-center">
            <p className="text-2xl font-bold text-white">{engajamento.salvas}</p>
            <p className="text-xs text-slate-400 mt-1">Oportunidades salvas</p>
          </div>
          <div className="rounded-xl bg-slate-700/50 p-4 text-center">
            <p className={`text-2xl font-bold ${engajamento.docsPct >= 80 ? 'text-emerald-400' : engajamento.docsPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {engajamento.docsPct}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Documentos em dia</p>
          </div>
          <div className="rounded-xl bg-slate-700/50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{engajamento.notifHorario}</p>
            <p className="text-xs text-slate-400 mt-1">Próximo alerta diário</p>
          </div>
        </div>
      </div>

    </div>
  )
}
