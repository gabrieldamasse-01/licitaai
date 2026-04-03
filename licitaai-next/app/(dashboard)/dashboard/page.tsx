import { createClient } from "@/lib/supabase/server"
import { Building2, FileText, Search, AlertTriangle, Clock, ArrowRight, Sparkles } from "lucide-react"
import { GraficoLicitacoes } from "@/components/domain/grafico-licitacoes"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

type CompanyRelation = { razao_social: string } | { razao_social: string }[] | null
type LicitacaoRelation = { objeto: string; orgao: string } | { objeto: string; orgao: string }[] | null

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
  if (!dataValidade) return { label: "Sem data", cls: "bg-slate-100 text-slate-500 border-slate-200" }
  const validade = new Date(dataValidade + "T00:00:00")
  const hoje = new Date()
  const em7 = new Date(); em7.setDate(hoje.getDate() + 7)
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30)
  if (validade < hoje) return { label: "Expirado", cls: "bg-red-100 text-red-700 border-red-200" }
  if (validade <= em7) return { label: "Crítico", cls: "bg-red-100 text-red-700 border-red-200" }
  if (validade <= em30) return { label: "Vencendo", cls: "bg-amber-100 text-amber-700 border-amber-200" }
  return { label: "Válido", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" }
}

async function getMetrics() {
  const supabase = await createClient()
  const hoje = new Date().toISOString().split("T")[0]
  const em30 = new Date(); em30.setDate(em30.getDate() + 30)
  const em30Str = em30.toISOString().split("T")[0]

  const [companies, matches, docsVencendo, docsExpirados] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .gte("data_validade", hoje)
      .lte("data_validade", em30Str),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .lt("data_validade", hoje),
  ])

  return {
    totalClientes: companies.count ?? 0,
    licitacoesSalvas: matches.count ?? 0,
    documentosVencendo: docsVencendo.count ?? 0,
    documentosExpirados: docsExpirados.count ?? 0,
  }
}

async function getDocumentosVencendo() {
  const supabase = await createClient()
  const hoje = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("documents")
    .select("id, tipo, nome_arquivo, data_validade, status, companies(razao_social)")
    .gte("data_validade", hoje)
    .order("data_validade", { ascending: true })
    .limit(5)
  return data ?? []
}

async function getUltimasOportunidades() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("matches")
    .select("id, licitacao_id, relevancia_score, status, created_at, licitacoes(objeto, orgao)")
    .order("created_at", { ascending: false })
    .limit(5)
  return data ?? []
}

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

export default async function DashboardPage() {
  const [metrics, documentosVencendo, ultimasOportunidades] = await Promise.all([
    getMetrics(),
    getDocumentosVencendo(),
    getUltimasOportunidades(),
  ])

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Bom dia!{" "}
            <span className="text-sm font-medium text-slate-500 block sm:inline sm:ml-2">
              Hoje é {formatDate(new Date().toISOString().split("T")[0])}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Aqui está o resumo da sua operação hoje.</p>
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
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-100"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs md:text-sm font-medium text-slate-500">{title}</p>
                <div className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl md:rounded-2xl shadow-sm ${iconBg}`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                  {metrics[key].toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1 truncate">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">Licitações por Mês</h2>
          <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses · dados ilustrativos</p>
        </div>
        <GraficoLicitacoes />
      </div>

      {/* Documentos Vencendo + Últimas Oportunidades */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Documentos com Vencimento Próximo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-amber-50 p-1.5 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Documentos com Vencimento Próximo</h2>
            </div>
            <Link
              href="/documentos"
              className="group flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0"
            >
              Ver todos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {documentosVencendo.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">Nenhum documento vencendo</p>
              <p className="text-xs text-slate-400 mt-1">Documentos com validade próxima aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
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
                      <p className="truncate text-sm font-semibold text-slate-900">{doc.tipo}</p>
                      <p className="truncate text-xs text-slate-500">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-blue-50 p-1.5 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Últimas Oportunidades Salvas</h2>
            </div>
            <Link
              href="/oportunidades"
              className="group flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0"
            >
              Ver todas <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {ultimasOportunidades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                <Sparkles className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">Nenhuma oportunidade salva</p>
              <p className="text-xs text-slate-400 mt-1">Licitações salvas aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {ultimasOportunidades.map((match) => {
                const licitacao = (match as { licitacoes: LicitacaoRelation }).licitacoes
                const objeto = getObjeto(licitacao)
                const orgao = getOrgao(licitacao)
                const titulo = objeto !== "—" ? objeto : `Licitação #${match.licitacao_id}`

                return (
                  <li key={match.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900 leading-snug">{titulo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="truncate text-xs text-slate-500">{orgao}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                        <p className="text-xs text-slate-400 shrink-0">
                          {formatDate((match.created_at as string).split("T")[0])}
                        </p>
                      </div>
                    </div>
                    {match.relevancia_score != null && match.relevancia_score > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
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
    </div>
  )
}
