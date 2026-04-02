import { createClient } from "@/lib/supabase/server"
import { Building2, FileText, Search, Target, Clock, ArrowRight, Sparkles } from "lucide-react"
import { GraficoLicitacoes } from "@/components/domain/grafico-licitacoes"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"


type CompanyRelation = { razao_social: string } | { razao_social: string }[] | null
type LicitacaoRelation = { objeto: string } | { objeto: string }[] | null

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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function getDocStatusBadge(status: string, dataValidade: string | null) {
  if (status === "vencido") return { label: "Expirado", cls: "bg-red-100 text-red-700 border-red-200" }
  if (status === "pendente") return { label: "Pendente", cls: "bg-slate-100 text-slate-500 border-slate-200" }
  if (status === "ativo" && dataValidade) {
    const validade = new Date(dataValidade + "T00:00:00")
    const em30 = new Date(); em30.setDate(em30.getDate() + 30)
    if (validade <= em30) return { label: "Vencendo", cls: "bg-amber-100 text-amber-700 border-amber-200" }
  }
  return { label: "Válido", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" }
}

function getMatchStatusBadge(status: string) {
  if (status === "interessado") return { label: "Interessado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" }
  if (status === "participando") return { label: "Participando", cls: "bg-violet-100 text-violet-700 border-violet-200" }
  if (status === "descartado") return { label: "Descartado", cls: "bg-slate-100 text-slate-500 border-slate-200" }
  return { label: "Nova", cls: "bg-blue-100 text-blue-700 border-blue-200" }
}

async function getMetrics() {
  const supabase = await createClient()
  const hoje = new Date().toISOString().split("T")[0]
  const em30 = new Date(); em30.setDate(em30.getDate() + 30)
  const em30Str = em30.toISOString().split("T")[0]

  const [companies, licitacoes, documentos, oportunidades] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    // Licitações = matches que não foram descartados
    supabase.from("matches").select("*", { count: "exact", head: true }).neq("status", "descartado"),
    supabase.from("documents").select("*", { count: "exact", head: true })
      .gte("data_validade", hoje).lte("data_validade", em30Str),
    // Oportunidades = matches com status 'interessado'
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "interessado"),
  ])

  return {
    totalClientes: companies.count ?? 0,
    licitacoesMonitoradas: licitacoes.count ?? 0,
    documentosVencendo: documentos.count ?? 0,
    oportunidadesAtivas: oportunidades.count ?? 0,
  }
}

async function getDocumentosRecentes() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("documents")
    .select("id, tipo, nome_arquivo, data_validade, status, companies(razao_social)")
    .order("created_at", { ascending: false })
    .limit(5)
  return data ?? []
}

async function getOportunidadesRecentes() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("matches")
    .select("id, licitacao_id, relevancia_score, status, companies(razao_social), licitacoes(objeto)")
    .neq("status", "descartado")
    .order("created_at", { ascending: false })
    .limit(3)
  return data ?? []
}

const metricCards = [
  {
    key: "totalClientes" as const,
    title: "Total de Clientes",
    description: "Empresas cadastradas",
    icon: Building2,
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    iconColor: "text-white",
  },
  {
    key: "licitacoesMonitoradas" as const,
    title: "Licitações",
    description: "Matches ativos",
    icon: Search,
    iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-500",
    iconColor: "text-white",
  },
  {
    key: "documentosVencendo" as const,
    title: "Docs. Vencendo",
    description: "Vencem em 30 dias",
    icon: FileText,
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-500",
    iconColor: "text-white",
  },
  {
    key: "oportunidadesAtivas" as const,
    title: "Oportunidades",
    description: "Status: interessado",
    icon: Target,
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
    iconColor: "text-white",
  },
]

export default async function DashboardPage() {
  const [metrics, documentosRecentes, oportunidadesRecentes] = await Promise.all([
    getMetrics(),
    getDocumentosRecentes(),
    getOportunidadesRecentes(),
  ])

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Bom dia! <span className="text-sm font-medium text-slate-500 block sm:inline sm:ml-2">Hoje é {formatDate(new Date().toISOString().split("T")[0])}</span>
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
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] md:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    ▲ +12%
                  </span>
                  <p className="text-[10px] md:text-xs text-slate-400 truncate">{description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Segunda linha: Gráfico */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">Licitações por Mês</h2>
          <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses · dados ilustrativos</p>
        </div>
        <GraficoLicitacoes />
      </div>

      {/* Terceira linha: Documentos Recentes + Oportunidades Recentes */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Documentos Recentes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1.5 rounded-lg">
                <Clock className="h-4 w-4 text-slate-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Documentos Recentes</h2>
            </div>
            <Link
              href="/documentos"
              className="group flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {documentosRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">Nenhum documento</p>
              <p className="text-xs text-slate-400 mt-1">Os documentos cadastrados aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {documentosRecentes.map((doc) => {
                const s = getDocStatusBadge(doc.status, doc.data_validade)
                const company = getRazaoSocial((doc as { companies: CompanyRelation }).companies)
                
                // Color dots for status
                let dotColor = "bg-emerald-500"
                if (s.label === "Expirado") dotColor = "bg-red-500"
                if (s.label === "Pendente") dotColor = "bg-slate-400"
                if (s.label === "Vencendo") dotColor = "bg-amber-500"

                // Row highlighting for critical ones
                const isWarning = s.label === "Vencendo" || s.label === "Expirado"

                return (
                  <li 
                    key={doc.id} 
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                      isWarning ? "bg-amber-50/30 border-amber-100/50 hover:bg-amber-50" : "bg-white border-transparent hover:bg-slate-50 border-b-slate-100"
                    }`}
                  >
                    <div className="flex flex-1 min-w-0 items-center gap-3">
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${dotColor} shadow-sm`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {doc.tipo}
                        </p>
                        <p className="truncate text-[11px] md:text-xs text-slate-500 mt-0.5">
                          {company} · Vence em {formatDate(doc.data_validade)}
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Oportunidades Recentes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-blue-50 p-1.5 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Oportunidades</h2>
            </div>
            <Link
              href="/oportunidades"
              className="group flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todas <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {oportunidadesRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                <Target className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">Nenhuma oportunidade</p>
              <p className="text-xs text-slate-400 mt-1">Oportunidades marcadas como interessadas aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {oportunidadesRecentes.map((match) => {
                const s = getMatchStatusBadge(match.status)
                const company = getRazaoSocial((match as { companies: CompanyRelation }).companies)
                const objeto = getObjeto((match as { licitacoes: LicitacaoRelation }).licitacoes)
                const titulo = objeto !== "—" ? objeto : `Licitação #${match.licitacao_id}`
                
                let dotColor = "bg-blue-500"
                if (s.label === "Interessado") dotColor = "bg-emerald-500"
                if (s.label === "Participando") dotColor = "bg-violet-500"

                return (
                  <li 
                    key={match.id} 
                    className="flex items-start md:items-center justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-slate-50 border-b-slate-100 transition-colors"
                  >
                    <div className="flex flex-1 min-w-0 items-start md:items-center gap-3">
                      <div className={`mt-1.5 md:mt-0 h-2 w-2 rounded-full shrink-0 ${dotColor} shadow-sm`} />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 md:truncate text-sm font-semibold text-slate-900 leading-snug">
                          {titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="truncate text-[11px] md:text-xs text-slate-500">
                            {company}
                          </p>
                          {match.relevancia_score != null && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Score {match.relevancia_score}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
