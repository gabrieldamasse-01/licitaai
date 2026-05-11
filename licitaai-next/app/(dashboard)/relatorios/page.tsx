import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Target,
  FileWarning,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type MesData, type EmpresaDocData } from "./graficos"
import {
  GraficoOportunidadesMesWrapper as GraficoOportunidadesMes,
  GraficoDocsEmpresaWrapper as GraficoDocsEmpresa,
} from "./graficos-wrapper"
import { ExportarRelatorioBtn } from "./exportar-relatorio-btn"

// ─── Checklist (espelhado de oportunidades/actions.ts) ────────────────────────

const DOCS_OBRIGATORIOS: { nome: string; keywords: string[] }[] = [
  { nome: "CND Federal", keywords: ["cnd federal", "certidao negativa federal", "debitos federais", "receita federal"] },
  { nome: "CND Estadual", keywords: ["cnd estadual", "certidao negativa estadual", "debito estadual"] },
  { nome: "CND Municipal", keywords: ["cnd municipal", "certidao negativa municipal", "debito municipal", "iss"] },
  { nome: "Certificado FGTS", keywords: ["fgts", "regularidade fgts", "crf fgts"] },
  { nome: "CNDT", keywords: ["cndt", "debitos trabalhistas", "trabalhista"] },
  { nome: "Contrato Social", keywords: ["contrato social", "estatuto", "ato constitutivo", "registro"] },
  { nome: "Procuração", keywords: ["procuracao", "procurador"] },
]

function normStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

type DocRow = {
  company_id: string
  tipo: string
  status: string
  data_validade: string | null
}

function contarDocsOk(docs: DocRow[], companyId: string, hoje: Date): number {
  const compDocs = docs.filter((d) => d.company_id === companyId)
  return DOCS_OBRIGATORIOS.reduce((count, { keywords }) => {
    const match = compDocs.find((d) =>
      keywords.some((kw) => normStr(d.tipo).includes(normStr(kw))),
    )
    if (!match) return count
    const v = match.data_validade ? new Date(match.data_validade + "T00:00:00") : null
    const valido = match.status !== "vencido" && (!v || v >= hoje)
    return valido ? count + 1 : count
  }, 0)
}

function listarDocsFaltando(docs: DocRow[], companyId: string, hoje: Date): string[] {
  const compDocs = docs.filter((d) => d.company_id === companyId)
  return DOCS_OBRIGATORIOS.filter(({ keywords }) => {
    const match = compDocs.find((d) =>
      keywords.some((kw) => normStr(d.tipo).includes(normStr(kw))),
    )
    if (!match) return true
    const v = match.data_validade ? new Date(match.data_validade + "T00:00:00") : null
    return match.status === "vencido" || (v && v < hoje)
  }).map((d) => d.nome)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(s: string | null) {
  if (!s) return "—"
  return new Date(s + "T00:00:00").toLocaleDateString("pt-BR")
}

function diasRestantes(dataValidade: string): number {
  const v = new Date(dataValidade + "T00:00:00")
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Empresas ativas
  const { data: companies } = await supabase
    .from("companies")
    .select("id, razao_social")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("razao_social")

  const companyIds = (companies ?? []).map((c) => c.id)

  // Datas
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeStr = hoje.toISOString().split("T")[0]

  const em7 = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
  const em7Str = em7.toISOString().split("T")[0]

  const em30 = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
  const em30Str = em30.toISOString().split("T")[0]

  const sixMonthsAgo = new Date(hoje)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  // Queries paralelas
  const [docsResult, matchesResult, docsCriticosResult, totalMatchesResult] =
    await Promise.all([
      companyIds.length > 0
        ? supabase
            .from("documents")
            .select("id, company_id, tipo, status, data_validade")
            .in("company_id", companyIds)
        : Promise.resolve({ data: [] }),

      companyIds.length > 0
        ? supabase
            .from("matches")
            .select("id, created_at")
            .in("company_id", companyIds)
            .gte("created_at", sixMonthsAgo.toISOString())
        : Promise.resolve({ data: [] }),

      companyIds.length > 0
        ? supabase
            .from("documents")
            .select("id, tipo, data_validade, company_id, companies(razao_social)")
            .gte("data_validade", hojeStr)
            .lte("data_validade", em7Str)
            .in("status", ["ativo", "pendente"])
            .in("company_id", companyIds)
            .order("data_validade", { ascending: true })
        : Promise.resolve({ data: [] }),

      companyIds.length > 0
        ? supabase
            .from("matches")
            .select("id", { count: "exact", head: true })
            .in("company_id", companyIds)
        : Promise.resolve({ count: 0 }),
    ])

  const docs: DocRow[] = (docsResult.data ?? []) as DocRow[]
  const matches = matchesResult.data ?? []
  const docsCriticos = docsCriticosResult.data ?? []
  const totalMatches = (totalMatchesResult as { count: number | null }).count ?? 0

  // ── Métricas dos cards ──────────────────────────────────────────────────────

  const docsVencendo30 = docs.filter((d) => {
    const v = d.data_validade
    return v && v >= hojeStr && v <= em30Str && d.status !== "vencido"
  }).length

  const empresasCompletas = (companies ?? []).filter(
    (c) => contarDocsOk(docs, c.id, hoje) === DOCS_OBRIGATORIOS.length,
  ).length

  const taxaHabilitacao =
    (companies ?? []).length > 0
      ? Math.round((empresasCompletas / (companies ?? []).length) * 100)
      : 0

  // ── Gráfico 1: oportunidades por mês ───────────────────────────────────────

  const matchesPorMes: Record<string, number> = {}
  for (const m of matches) {
    const d = new Date(m.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    matchesPorMes[key] = (matchesPorMes[key] ?? 0) + 1
  }

  const mesesData: MesData[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje)
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const mes = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    return { mes: mes.replace(".", ""), quantidade: matchesPorMes[key] ?? 0 }
  })

  // ── Gráfico 2: status docs por empresa ─────────────────────────────────────

  const docsEmpresaData: EmpresaDocData[] = (companies ?? [])
    .map((company) => {
      const compDocs = docs.filter((d) => d.company_id === company.id)
      if (compDocs.length === 0) return null

      let validos = 0,
        vencendo = 0,
        expirados = 0
      for (const doc of compDocs) {
        const v = doc.data_validade ? new Date(doc.data_validade + "T00:00:00") : null
        if (doc.status === "vencido" || (v && v < hoje)) expirados++
        else if (v && v <= em30) vencendo++
        else validos++
      }
      // Abreviar nome para caber no eixo X
      const palavras = company.razao_social.split(" ")
      const empresa = palavras.slice(0, 2).join(" ")
      return { empresa, validos, vencendo, expirados }
    })
    .filter(Boolean) as EmpresaDocData[]

  // ── Tabela: empresas com habilitação incompleta ─────────────────────────────

  const empresasIncompletas = (companies ?? [])
    .map((c) => ({
      ...c,
      faltando: listarDocsFaltando(docs, c.id, hoje),
    }))
    .filter((c) => c.faltando.length > 0)

  return (
    <div className="space-y-8">
      {/* Título */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="text-sm text-slate-400 mt-1">
            Visão geral de clientes, documentos e oportunidades
          </p>
        </div>
        <ExportarRelatorioBtn />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Clientes Ativos"
          value={(companies ?? []).length}
          icon={<Users className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          borderColor="metric-card-blue"
          valueColor="text-blue-400"
        />
        <MetricCard
          label="Oportunidades Salvas"
          value={totalMatches}
          icon={<Target className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-emerald-400 to-emerald-600"
          borderColor="metric-card-emerald"
          valueColor="text-emerald-400"
        />
        <MetricCard
          label="Docs Vencendo (30d)"
          value={docsVencendo30}
          icon={<FileWarning className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-amber-400 to-amber-500"
          borderColor="metric-card-amber"
          valueColor={docsVencendo30 > 0 ? "text-amber-400" : undefined}
        />
        <MetricCard
          label="Taxa de Habilitação"
          value={`${taxaHabilitacao}%`}
          icon={<ShieldCheck className="h-5 w-5 text-white" />}
          iconBg="bg-blue-600"
          borderColor="metric-card-blue"
          valueColor="text-blue-400"
          sub={`${empresasCompletas} de ${(companies ?? []).length} completa${empresasCompletas !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Oportunidades Salvas por Mês" sub="Últimos 6 meses">
          <GraficoOportunidadesMes data={mesesData} />
        </ChartCard>

        <ChartCard title="Status de Documentos por Empresa">
          <GraficoDocsEmpresa data={docsEmpresaData} />
        </ChartCard>
      </div>

      {/* Documentos críticos */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h2 className="text-base font-semibold text-white">
            Documentos Críticos
          </h2>
          <span className="text-sm text-slate-400">(vencendo em até 7 dias)</span>
        </div>

        {docsCriticos.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-10 text-center justify-center">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <p className="text-sm font-medium text-slate-400">
              Nenhum documento crítico nos próximos 7 dias
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-red-900/50 bg-slate-800 overflow-hidden">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="bg-red-950/30 border-slate-700">
                  <TableHead className="text-slate-400">Tipo</TableHead>
                  <TableHead className="text-slate-400">Empresa</TableHead>
                  <TableHead className="text-slate-400">Validade</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docsCriticos.map((doc) => {
                  const lic = Array.isArray(doc.companies)
                    ? doc.companies[0]
                    : doc.companies
                  const dias = doc.data_validade
                    ? diasRestantes(doc.data_validade)
                    : null
                  return (
                    <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="font-medium text-white">{doc.tipo ?? "—"}</TableCell>
                      <TableCell className="text-slate-400">
                        {(lic as { razao_social?: string } | null)?.razao_social ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(doc.data_validade)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-red-900/50 text-red-400 border-red-800/50 font-semibold"
                        >
                          {dias !== null
                            ? dias === 0
                              ? "Vence hoje"
                              : `${dias}d restante${dias !== 1 ? "s" : ""}`
                            : "CRÍTICO"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Habilitação incompleta */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-semibold text-white">
            Empresas com Habilitação Incompleta
          </h2>
          {empresasIncompletas.length > 0 && (
            <span className="text-sm text-slate-400">
              ({empresasIncompletas.length})
            </span>
          )}
        </div>

        {empresasIncompletas.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 px-6 py-10 text-center justify-center">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <p className="text-sm font-medium text-slate-400">
              Todas as empresas com habilitação completa
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="bg-slate-800 border-slate-700">
                  <TableHead className="text-slate-400">Empresa</TableHead>
                  <TableHead className="text-slate-400">Documentos Faltando</TableHead>
                  <TableHead className="text-right text-slate-400">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresasIncompletas.map((empresa) => (
                  <TableRow key={empresa.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="font-medium text-white">{empresa.razao_social}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {empresa.faltando.map((doc) => (
                          <Badge
                            key={doc}
                            variant="outline"
                            className="bg-amber-900/50 text-amber-400 border-amber-800/50 text-xs"
                          >
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white hover:bg-slate-700">
                        <Link href={`/clientes/${empresa.id}`}>
                          Ver cliente
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  iconBg,
  borderColor,
  valueColor,
  sub,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg?: string
  borderColor?: string
  valueColor?: string
  sub?: string
}) {
  return (
    <div className={`metric-card ${borderColor ?? ""} rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${iconBg ?? "bg-slate-700"}`}>
          {icon}
        </div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right leading-tight max-w-[80px]">
          {label}
        </p>
      </div>
      <div>
        <p className={`text-4xl font-bold tracking-tight text-white ${valueColor ?? ""}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  sub,
  children,
}: {
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
