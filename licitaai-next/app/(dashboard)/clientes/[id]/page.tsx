import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  Target,
  ShieldCheck,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Inbox,
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
import { buscarChecklistDocumentos } from "@/app/(dashboard)/oportunidades/actions"
import { ClienteEditarSheet } from "./cliente-detalhe-actions"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PORTE_LABELS: Record<string, string> = {
  MEI: "MEI",
  ME: "ME",
  EPP: "EPP",
  MEDIO: "Médio",
  GRANDE: "Grande",
}

function displayCNPJ(cnpj: string) {
  const d = cnpj.replace(/\D/g, "")
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR")
}

function truncate(text: string, max = 80) {
  return text.length <= max ? text : text.slice(0, max) + "…"
}

type DocStatus = {
  label: string
  className: string
}

function resolveDocStatus(
  status: string,
  dataValidade: string | null,
  hoje: Date,
  em30: Date,
): DocStatus {
  const validade = dataValidade ? new Date(dataValidade + "T00:00:00") : null
  if (validade && validade < hoje)
    return { label: "Expirado", className: "bg-red-100 text-red-700 border-red-200" }
  if (validade && validade <= em30)
    return { label: "Vencendo", className: "bg-amber-100 text-amber-700 border-amber-200" }
  if (status === "ativo")
    return { label: "Válido", className: "bg-emerald-100 text-emerald-700 border-emerald-200" }
  const map: Record<string, DocStatus> = {
    pendente: { label: "Pendente", className: "bg-blue-100 text-blue-700 border-blue-200" },
    processando: { label: "Processando", className: "bg-blue-100 text-blue-700 border-blue-200" },
    rejeitado: { label: "Rejeitado", className: "bg-red-100 text-red-700 border-red-200" },
    vencido: { label: "Expirado", className: "bg-red-100 text-red-700 border-red-200" },
  }
  return map[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" }
}

function scoreClassName(score: number) {
  if (score >= 85) return "bg-emerald-100 text-emerald-700 border-emerald-200"
  if (score >= 70) return "bg-blue-100 text-blue-700 border-blue-200"
  if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-200"
  return "bg-slate-100 text-slate-600 border-slate-200"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: company } = await supabase
    .from("companies")
    .select("id, razao_social, cnpj, porte, cnae, email_contato, contato, ativo")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!company) notFound()

  const [{ data: docsRaw }, { data: matchesRaw }, { itens: checklist }] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id, tipo, nome_arquivo, data_emissao, data_validade, status")
        .eq("company_id", id)
        .order("data_validade", { ascending: true }),
      supabase
        .from("matches")
        .select("id, relevancia_score, status, created_at, licitacoes(objeto, orgao)")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      buscarChecklistDocumentos(id),
    ])

  const docs = docsRaw ?? []
  const matches = matchesRaw ?? []

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em30 = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

  const docValidos = docs.filter((d) => {
    const v = d.data_validade ? new Date(d.data_validade + "T00:00:00") : null
    return d.status === "ativo" && (!v || v > em30)
  }).length

  const docVencendo = docs.filter((d) => {
    const v = d.data_validade ? new Date(d.data_validade + "T00:00:00") : null
    return v && v >= hoje && v <= em30
  }).length

  const docExpirados = docs.filter((d) => {
    const v = d.data_validade ? new Date(d.data_validade + "T00:00:00") : null
    return d.status === "vencido" || (v && v < hoje)
  }).length

  const checklistOk = checklist.filter((i) => i.status === "ok").length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/clientes" className="hover:text-slate-800 transition-colors">
          Clientes
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate max-w-xs">
          {company.razao_social}
        </span>
      </nav>

      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{company.razao_social}</h1>
              <Badge
                variant="outline"
                className={
                  company.ativo
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }
              >
                {company.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="font-mono text-sm text-slate-500">{displayCNPJ(company.cnpj)}</p>
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500">
              <Badge variant="outline">{PORTE_LABELS[company.porte] ?? company.porte}</Badge>
              {company.cnae?.[0] && <span>{company.cnae[0]}</span>}
              {company.email_contato && (
                <span className="hidden sm:inline">· {company.email_contato}</span>
              )}
              {company.contato && (
                <span className="hidden sm:inline">· {company.contato}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/clientes">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Voltar
              </Link>
            </Button>
            <ClienteEditarSheet company={company} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total de Documentos"
          value={docs.length}
          icon={<FileText className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-slate-500 to-slate-600"
          borderColor="metric-card-slate"
        />
        <SummaryCard
          label="Válidos"
          value={docValidos}
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-emerald-400 to-emerald-600"
          borderColor="metric-card-emerald"
          valueClassName="text-emerald-600"
        />
        <SummaryCard
          label="Vencendo / Expirados"
          value={docVencendo + docExpirados}
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-amber-400 to-amber-500"
          borderColor="metric-card-amber"
          valueClassName={docVencendo + docExpirados > 0 ? "text-amber-600" : undefined}
        />
        <SummaryCard
          label="Oportunidades Salvas"
          value={matches.length}
          icon={<Target className="h-5 w-5 text-white" />}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          borderColor="metric-card-blue"
          valueClassName="text-blue-600"
        />
      </div>

      {/* Documentos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Documentos</h2>
            <span className="text-sm text-slate-500">({docs.length})</span>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/documentos?empresa=${id}`}>
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar Documento
            </Link>
          </Button>
        </div>

        {docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-slate-300" />}
            message="Nenhum documento cadastrado"
            sub="Adicione documentos de habilitação para este cliente."
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const { label, className } = resolveDocStatus(
                    doc.status,
                    doc.data_validade,
                    hoje,
                    em30,
                  )
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.tipo || doc.nome_arquivo || "—"}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatDate(doc.data_emissao)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatDate(doc.data_validade)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={className}>
                          {label}
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

      {/* Oportunidades Salvas */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Oportunidades Salvas</h2>
          <span className="text-sm text-slate-500">({matches.length})</span>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-10 w-10 text-slate-300" />}
            message="Nenhuma oportunidade salva"
            sub="Acesse Oportunidades para encontrar licitações relevantes."
            action={
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link href="/oportunidades">Ver Oportunidades</Link>
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Objeto</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Salvo em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const lic = Array.isArray(match.licitacoes)
                    ? match.licitacoes[0]
                    : match.licitacoes
                  return (
                    <TableRow key={match.id}>
                      <TableCell className="max-w-xs">
                        <span className="text-sm leading-snug">
                          {lic?.objeto ? truncate(lic.objeto) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {lic?.orgao ? truncate(lic.orgao, 40) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={scoreClassName(match.relevancia_score ?? 0)}
                        >
                          {match.relevancia_score ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {match.created_at
                          ? new Date(match.created_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Habilitação */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Habilitação</h2>
          <span className="text-sm text-slate-500">
            {checklistOk}/{checklist.length} documentos ok
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {checklist.map((item) => (
            <div key={item.nome} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.status === "ok" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                )}
                {item.status === "vencendo" && (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                )}
                {(item.status === "vencido" || item.status === "faltando") && (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    item.status === "faltando" ? "text-slate-400" : "text-slate-800"
                  }`}
                >
                  {item.nome}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.validade && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(item.validade)}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={
                    item.status === "ok"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : item.status === "vencendo"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : item.status === "vencido"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                  }
                >
                  {item.status === "ok"
                    ? "OK"
                    : item.status === "vencendo"
                      ? "Vencendo"
                      : item.status === "vencido"
                        ? "Vencido"
                        : "Faltando"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  iconBg,
  borderColor,
  valueClassName,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg?: string
  borderColor?: string
  valueClassName?: string
}) {
  return (
    <div className={`metric-card ${borderColor ?? ""} rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${iconBg ?? "bg-slate-100"}`}>
          {icon}
        </div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right leading-tight max-w-[80px]">
          {label}
        </p>
      </div>
      <p className={`text-4xl font-bold tracking-tight text-slate-900 ${valueClassName ?? ""}`}>{value}</p>
    </div>
  )
}

function EmptyState({
  icon,
  message,
  sub,
  action,
}: {
  icon: React.ReactNode
  message: string
  sub: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center px-4">
      {icon}
      <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
      {action}
    </div>
  )
}
