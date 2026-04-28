import { notFound } from "next/navigation"
import Link from "next/link"
import { format, parseISO, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Scale,
  CalendarIcon,
  MapPin,
  Hash,
  Globe,
  DollarSign,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getImpersonatingUserId } from "@/lib/impersonation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnaliseIaSection } from "./analise-ia-section"

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

function getPrazoRestante(dataEncerramento: string | null): {
  texto: string
  classe: string
} | null {
  if (!dataEncerramento) return null
  try {
    const encerra = parseISO(dataEncerramento.split(" ")[0])
    const dias = differenceInDays(encerra, new Date())
    if (dias > 0) {
      const classe =
        dias <= 3
          ? "bg-red-950/60 text-red-300 border-red-800/50"
          : dias <= 10
          ? "bg-amber-950/60 text-amber-300 border-amber-800/50"
          : "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
      return { texto: `Encerra em ${dias} dia${dias === 1 ? "" : "s"}`, classe }
    } else {
      const diasPassados = Math.abs(dias)
      return {
        texto: `Encerrada há ${diasPassados} dia${diasPassados === 1 ? "" : "s"}`,
        classe: "bg-slate-800/60 text-slate-400 border-slate-700",
      }
    }
  } catch {
    return null
  }
}

function getModalidadeClass(modalidade: string): string {
  if (modalidade.includes("Pregão"))
    return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  if (modalidade === "Dispensa")
    return "bg-amber-950/60 text-amber-300 border-amber-800/50"
  if (modalidade === "Concorrência")
    return "bg-violet-950/60 text-violet-300 border-violet-800/50"
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

  // Licitação atual
  const { data: lic } = await supabase
    .from("licitacoes")
    .select("*")
    .eq("id", id)
    .single()

  if (!lic) notFound()

  // Navegação: licitações anterior e próxima (ordenadas por data_publicacao desc)
  const [{ data: anterior }, { data: proxima }] = await Promise.all([
    supabase
      .from("licitacoes")
      .select("id, objeto")
      .gt("data_publicacao", lic.data_publicacao ?? "")
      .eq("status", lic.status ?? "ativa")
      .order("data_publicacao", { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from("licitacoes")
      .select("id, objeto")
      .lt("data_publicacao", lic.data_publicacao ?? "")
      .eq("status", lic.status ?? "ativa")
      .order("data_publicacao", { ascending: false })
      .limit(1)
      .single(),
  ])

  // Matches com empresas
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

  // Empresas do usuário
  const impersonatingUserId = await getImpersonatingUserId()
  const effectiveUserId = impersonatingUserId ?? user?.id
  const { data: empresas } = effectiveUserId
    ? await createServiceClient()
        .from("companies")
        .select("id, razao_social")
        .eq("user_id", effectiveUserId)
        .order("razao_social")
    : { data: [] }

  const jaSalvasPorEmpresa = new Set(
    matches
      .filter((m) => (empresas ?? []).some((e) => e.id === m.company_id))
      .map((m) => m.company_id)
  )

  const prazo = getPrazoRestante(lic.data_encerramento)

  const glassCard = "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"

  const campos: { label: string; value: string | null | undefined; icon: React.ReactNode }[] = [
    { label: "Órgão", value: lic.orgao, icon: <Building2 className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "Modalidade", value: lic.modalidade, icon: <Scale className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "UF", value: lic.uf, icon: <MapPin className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "Portal", value: lic.portal?.replace("Portal Nacional de Contratações Públicas - ", ""), icon: <Globe className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "Nº do Processo", value: lic.numero_processo || lic.source_id, icon: <Hash className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "Publicação", value: formatDate(lic.data_publicacao), icon: <CalendarIcon className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "Abertura", value: formatDate(lic.data_abertura), icon: <CalendarIcon className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "Encerramento", value: formatDate(lic.data_encerramento), icon: <CalendarIcon className="h-3.5 w-3.5 text-slate-500" /> },
    { label: "Valor Estimado", value: formatCurrency(lic.valor_estimado), icon: <DollarSign className="h-3.5 w-3.5 text-slate-500" /> },
  ]

  const objetoTruncado = lic.objeto
    ? lic.objeto.length > 60
      ? lic.objeto.slice(0, 60) + "…"
      : lic.objeto
    : "Sem descrição"

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Breadcrumb + Botão voltar */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link
          href="/licitacoes"
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Licitações
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
        <span className="text-slate-300 truncate max-w-xs">{objetoTruncado}</span>
      </div>

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
        {prazo && (
          <Badge variant="outline" className={cn("text-xs font-semibold", prazo.classe)}>
            {prazo.texto}
          </Badge>
        )}
      </div>

      {/* Título */}
      <h1 className="text-2xl font-bold text-white leading-relaxed">
        {lic.objeto || "Sem descrição"}
      </h1>

      {/* Valor em destaque */}
      {lic.valor_estimado ? (
        <div className="flex items-baseline gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-3xl font-extrabold text-white">
            {formatCurrency(lic.valor_estimado)}
          </p>
        </div>
      ) : null}

      {/* Layout de duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — dados completos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grid de campos — liquid glass */}
          <div className={glassCard}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Dados da Licitação
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campos.map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 flex items-start gap-2.5"
                >
                  <span className="mt-0.5 shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="text-sm text-slate-100 mt-0.5 font-medium break-words">
                      {value || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empresas compatíveis — liquid glass */}
          <div className={glassCard}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Empresas que salvaram esta licitação ({matches.length})
            </p>

            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <Scale className="h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-500">
                  Nenhuma empresa salvou esta licitação ainda.
                </p>
                {empresas && empresas.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Use o botão <span className="text-blue-400 font-medium">&quot;Salvar Oportunidade&quot;</span> ao lado para salvar para sua empresa.
                  </p>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {matches.map((m) => {
                  const empresa = Array.isArray(m.companies) ? m.companies[0] : m.companies
                  if (!empresa) return null
                  return (
                    <li
                      key={m.company_id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
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

          {/* Navegação anterior / próxima */}
          <div className="flex items-center justify-between gap-3">
            {anterior ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 gap-1.5 max-w-[48%]"
              >
                <Link href={`/licitacoes/${anterior.id}`}>
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {(anterior.objeto as string | null)
                      ? (anterior.objeto as string).slice(0, 35) + "…"
                      : "Anterior"}
                  </span>
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {proxima ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 gap-1.5 max-w-[48%] ml-auto"
              >
                <Link href={`/licitacoes/${proxima.id}`}>
                  <span className="truncate">
                    {(proxima.objeto as string | null)
                      ? (proxima.objeto as string).slice(0, 35) + "…"
                      : "Próxima"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <AnaliseIaSection
          licitacaoId={id}
          sourceUrl={lic.source_url}
          status={lic.status ?? "ativa"}
          empresas={empresas ?? []}
          jaSalvasPorEmpresa={jaSalvasPorEmpresa}
        />
      </div>
    </div>
  )
}
