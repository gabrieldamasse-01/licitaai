import { createClient } from "@/lib/supabase/server"
import { Building2, FileText, Search, Target, Clock } from "lucide-react"
import { GraficoLicitacoes } from "@/components/grafico-licitacoes"
import { Badge } from "@/components/ui/badge"

type CompanyRelation = { razao_social: string } | { razao_social: string }[] | null

function getRazaoSocial(companies: CompanyRelation): string {
  if (!companies) return "—"
  if (Array.isArray(companies)) return companies[0]?.razao_social ?? "—"
  return companies.razao_social
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function getStatusBadge(status: string, dataValidade: string | null) {
  if (status === "vencido") return { label: "Expirado", cls: "bg-red-100 text-red-700 border-red-200" }
  if (status === "pendente") return { label: "Pendente", cls: "bg-slate-100 text-slate-500 border-slate-200" }
  if (status === "ativo" && dataValidade) {
    const validade = new Date(dataValidade + "T00:00:00")
    const em30 = new Date(); em30.setDate(em30.getDate() + 30)
    if (validade <= em30) return { label: "Vencendo", cls: "bg-amber-100 text-amber-700 border-amber-200" }
  }
  return { label: "Válido", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" }
}

async function getMetrics() {
  const supabase = await createClient()
  const hoje = new Date().toISOString().split("T")[0]
  const em30 = new Date(); em30.setDate(em30.getDate() + 30)
  const em30Str = em30.toISOString().split("T")[0]

  const [companies, licitacoes, documentos, oportunidades] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("licitacoes").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true })
      .gte("data_validade", hoje).lte("data_validade", em30Str),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "pendente"),
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

const metricCards = [
  {
    key: "totalClientes" as const,
    title: "Total de Clientes",
    description: "Empresas cadastradas",
    icon: Building2,
    border: "border-l-blue-500",
    iconRing: "bg-blue-100",
    iconColor: "text-blue-600",
    valueColor: "text-slate-900",
  },
  {
    key: "licitacoesMonitoradas" as const,
    title: "Licitações",
    description: "Editais monitorados",
    icon: Search,
    border: "border-l-emerald-500",
    iconRing: "bg-emerald-100",
    iconColor: "text-emerald-600",
    valueColor: "text-slate-900",
  },
  {
    key: "documentosVencendo" as const,
    title: "Docs. Vencendo",
    description: "Vencem em 30 dias",
    icon: FileText,
    border: "border-l-amber-500",
    iconRing: "bg-amber-100",
    iconColor: "text-amber-600",
    valueColor: "text-slate-900",
  },
  {
    key: "oportunidadesAtivas" as const,
    title: "Oportunidades",
    description: "Matches pendentes",
    icon: Target,
    border: "border-l-violet-500",
    iconRing: "bg-violet-100",
    iconColor: "text-violet-600",
    valueColor: "text-slate-900",
  },
]

export default async function DashboardPage() {
  const [metrics, documentosRecentes] = await Promise.all([
    getMetrics(),
    getDocumentosRecentes(),
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
        {metricCards.map(({ key, title, description, icon: Icon, border, iconRing, iconColor, valueColor }) => (
          <div
            key={key}
            className={`relative overflow-hidden rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${border}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className={`mt-2 text-4xl font-bold tracking-tight ${valueColor}`}>
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

      {/* Segunda linha: Gráfico + Tabela recentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Gráfico */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900">Licitações por Mês</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses • dados ilustrativos</p>
          </div>
          <GraficoLicitacoes />
        </div>

        {/* Documentos Recentes */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Documentos Recentes</h2>
          </div>

          {documentosRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Nenhum documento<br />cadastrado ainda</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {documentosRecentes.map((doc) => {
                const s = getStatusBadge(doc.status, doc.data_validade)
                const company = getRazaoSocial((doc as { companies: CompanyRelation }).companies)
                return (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.tipo}</p>
                      <p className="truncate text-xs text-slate-400 mt-0.5">{company} · {formatDate(doc.data_validade)}</p>
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
