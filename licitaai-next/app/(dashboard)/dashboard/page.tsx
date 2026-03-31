import { createClient } from "@/lib/supabase/server"
import { Building2, FileText, Search, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function getMetrics() {
  const supabase = await createClient()

  const hoje = new Date()
  const em30Dias = new Date()
  em30Dias.setDate(hoje.getDate() + 30)

  const [companies, licitacoes, documentos, oportunidades] = await Promise.all([
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("licitacoes")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .gte("data_validade", hoje.toISOString())
      .lte("data_validade", em30Dias.toISOString()),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
  ])

  return {
    totalClientes: companies.count ?? 0,
    licitacoesMonitoradas: licitacoes.count ?? 0,
    documentosVencendo: documentos.count ?? 0,
    oportunidadesAtivas: oportunidades.count ?? 0,
  }
}

const cards = [
  {
    title: "Total de Clientes",
    key: "totalClientes" as const,
    icon: Building2,
    description: "Empresas cadastradas",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Licitações Monitoradas",
    key: "licitacoesMonitoradas" as const,
    icon: Search,
    description: "Editais em acompanhamento",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Documentos Vencendo",
    key: "documentosVencendo" as const,
    icon: FileText,
    description: "Vencem nos próximos 30 dias",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Oportunidades Ativas",
    key: "oportunidadesAtivas" as const,
    icon: Target,
    description: "Matches com status pendente",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
]

export default async function DashboardPage() {
  const metrics = await getMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visão geral da plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, key, icon: Icon, description, color, bg }) => (
          <Card key={key} className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {metrics[key].toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
