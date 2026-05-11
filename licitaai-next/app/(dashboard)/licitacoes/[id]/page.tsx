import { notFound } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Building2, Scale } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnaliseIaSection } from "./analise-ia-section"
import { ChecklistSection } from "./checklist-section"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null): string {
  if (!value || value === 0) return "Não informado"
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    return format(parseISO(dateStr.split(" ")[0]), "dd/MM/yyyy", {
      locale: ptBR,
    })
  } catch {
    return dateStr.split(" ")[0]
  }
}

function getModalidadeClass(modalidade: string): string {
  if (modalidade.includes("Pregão"))
    return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  if (modalidade === "Dispensa")
    return "bg-amber-950/60 text-amber-300 border-amber-800/50"
  if (modalidade === "Concorrência")
    return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  if (modalidade === "Credenciamento")
    return "bg-cyan-950/60 text-cyan-300 border-cyan-800/50"
  if (modalidade === "Inexigibilidade")
    return "bg-rose-950/60 text-rose-300 border-rose-800/50"
  return "bg-slate-800 text-slate-300 border-slate-700"
}

function getPortalClass(portal: string): string {
  if (portal.includes("PNCP"))
    return "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
  if (portal.includes("ComprasNet"))
    return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  return "bg-slate-800 text-slate-300 border-slate-700"
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400"
  if (score >= 65) return "text-yellow-400"
  return "text-slate-400"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LicitacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Licitação
  const { data: lic } = await supabase
    .from("licitacoes")
    .select("*")
    .eq("id", id)
    .single()

  if (!lic) notFound()

  // Matches com empresas (busca pública — mostra quais empresas salvaram)
  const { data: matchesRaw } = await supabase
    .from("matches")
    .select("relevancia_score, status, company_id, companies(id, razao_social, cnpj)")
    .eq("licitacao_id", id)
    .order("relevancia_score", { ascending: false })

  type MatchRow = {
    relevancia_score: number
    status: string
    company_id: string
    companies: { id: string; razao_social: string; cnpj: string } | { id: string; razao_social: string; cnpj: string }[] | null
  }

  const matches = (matchesRaw ?? []) as unknown as MatchRow[]

  // Empresas do usuário (para salvar oportunidade + checklist)
  const { data: empresas } = user
    ? await supabase
        .from("companies")
        .select("id, razao_social, cnae")
        .eq("user_id", user.id)
        .order("razao_social")
    : { data: [] }

  const jaSalvasPorEmpresa = new Set(
    matches
      .filter((m) => (empresas ?? []).some((e) => e.id === m.company_id))
      .map((m) => m.company_id)
  )

  const campos = [
    { label: "Órgão", value: lic.orgao },
    { label: "Modalidade", value: lic.modalidade },
    { label: "UF", value: lic.uf },
    { label: "Portal", value: lic.portal?.replace("Portal Nacional de Contratações Públicas - ", "") },
    { label: "Nº do Processo", value: lic.numero_processo || lic.source_id },
    { label: "Publicação", value: formatDate(lic.data_publicacao) },
    { label: "Abertura", value: formatDate(lic.data_abertura) },
    { label: "Encerramento", value: formatDate(lic.data_encerramento) },
    { label: "Valor Estimado", value: formatCurrency(lic.valor_estimado) },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Botão voltar */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-slate-400 hover:text-white -ml-1 gap-1.5"
      >
        <Link href="/licitacoes">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Licitações
        </Link>
      </Button>

      {/* Badges de classificação */}
      <div className="flex flex-wrap gap-1.5">
        {lic.uf && (
          <Badge
            variant="outline"
            className="text-xs font-bold bg-slate-700 text-slate-300 border-slate-600"
          >
            {lic.uf}
          </Badge>
        )}
        {lic.modalidade && (
          <Badge
            variant="outline"
            className={cn("text-xs", getModalidadeClass(lic.modalidade))}
          >
            {lic.modalidade}
          </Badge>
        )}
        {lic.portal && (
          <Badge
            variant="outline"
            className={cn("text-xs", getPortalClass(lic.portal))}
          >
            {lic.portal.replace("Portal Nacional de Contratações Públicas - ", "")}
          </Badge>
        )}
      </div>

      {/* Título */}
      <h1 className="text-2xl font-bold text-white leading-relaxed">
        {lic.objeto || "Sem descrição"}
      </h1>

      {/* Valor em destaque */}
      {lic.valor_estimado ? (
        <p className="text-3xl font-extrabold text-white">
          {formatCurrency(lic.valor_estimado)}
        </p>
      ) : null}

      {/* Layout de duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — dados completos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grid de campos */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Dados da Licitação
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campos.map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="text-sm text-slate-100 mt-0.5 font-medium break-words">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Empresas compatíveis */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Empresas que salvaram esta licitação ({matches.length})
            </p>

            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Scale className="h-8 w-8 text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">
                  Nenhuma empresa salvou esta licitação ainda.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-700">
                {matches.map((m) => {
                  const empresa = Array.isArray(m.companies) ? m.companies[0] : m.companies
                  if (!empresa) return null
                  return (
                    <li
                      key={m.company_id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700">
                          <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">
                            {empresa.razao_social}
                          </p>
                          {empresa.cnpj && (
                            <p className="text-xs text-slate-500">
                              CNPJ: {empresa.cnpj}
                            </p>
                          )}
                        </div>
                      </div>
                      {m.relevancia_score > 0 && (
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-sm font-bold",
                              scoreColor(m.relevancia_score)
                            )}
                          >
                            {m.relevancia_score}%
                          </p>
                          <p className="text-[10px] text-slate-500">score</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <AnaliseIaSection
          licitacaoId={id}
          sourceUrl={lic.source_url}
          status={lic.status ?? "ativa"}
          empresas={(empresas ?? []).map((e) => ({ id: e.id, razao_social: e.razao_social }))}
          jaSalvasPorEmpresa={jaSalvasPorEmpresa}
        />
      </div>

      {/* Checklist de habilitação */}
      {user && (empresas ?? []).length > 0 && (
        <ChecklistSection
          licitacaoId={id}
          sourceUrl={lic.source_url ?? null}
          empresas={(empresas ?? []).map((e) => ({
            id: e.id,
            razao_social: e.razao_social,
            cnae: (e.cnae as string[] | null) ?? [],
          }))}
        />
      )}
    </div>
  )
}
