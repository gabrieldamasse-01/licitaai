import { createClient } from "@/lib/supabase/server"
import { Building2, FileText, Search, Target, Clock, ArrowRight, Sparkles } from "lucide-react"
import { GraficoLicitacoes } from "@/components/grafico-licitacoes"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
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
    border: "border-l-blue-500",
    iconRing: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    key: "licitacoesMonitoradas" as const,
    title: "Licitações",
    description: "Matches ativos",
    icon: Search,
    border: "border-l-emerald-500",
    iconRing: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    key: "documentosVencendo" as const,
    title: "Docs. Vencendo",
    description: "Vencem em 30 dias",
    icon: FileText,
    border: "border-l-amber-500",
    iconRing: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    key: "oportunidadesAtivas" as const,
    title: "Oportunidades",
    description: "Status: interessado",
    icon: Target,
    border: "border-l-violet-500",
    iconRing: "bg-violet-100",
    iconColor: "text-violet-600",
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Visão geral da plataforma LicitaAI</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ key, title, description, icon: Icon, border, iconRing, iconColor }) => (
          <div
            key={key}
            className={`relative overflow-hidden rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${border}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                  {metrics[key].toLocaleString("pt-BR")}
                </p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconRing}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Documentos Recentes */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Documentos Recentes</h2>
            </div>
            <Link
              href="/documentos"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {documentosRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Nenhum documento<br />cadastrado ainda</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {documentosRecentes.map((doc) => {
                const s = getDocStatusBadge(doc.status, doc.data_validade)
                const company = getRazaoSocial((doc as { companies: CompanyRelation }).companies)
                return (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.tipo}</p>
                      <p className="truncate text-xs text-slate-400 mt-0.5">
                        {company} · {formatDate(doc.data_validade)}
                      </p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[11px] px-2 py-0.5 ${s.cls}`}>
                      {s.label}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Oportunidades Recentes */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Oportunidades Recentes</h2>
            </div>
            <Link
              href="/oportunidades"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {oportunidadesRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Target className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Nenhuma oportunidade<br />salva ainda</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {oportunidadesRecentes.map((match) => {
                const s = getMatchStatusBadge(match.status)
                const company = getRazaoSocial((match as { companies: CompanyRelation }).companies)
                const objeto = getObjeto((match as { licitacoes: LicitacaoRelation }).licitacoes)
                const titulo = objeto !== "—" ? objeto : `Licitação #${match.licitacao_id}`
                return (
                  <li key={match.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{titulo}</p>
                      <p className="truncate text-xs text-slate-400 mt-0.5">
                        {company}
                        {match.relevancia_score != null && (
                          <span className="ml-1.5 font-medium text-violet-600">
                            · score {match.relevancia_score}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[11px] px-2 py-0.5 ${s.cls}`}>
                      {s.label}
                    </Badge>
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
