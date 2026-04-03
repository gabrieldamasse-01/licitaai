"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Building2, Target, Loader2, ExternalLink, BookmarkPlus,
  ChevronRight, Check, AlertCircle, Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  buscarOportunidades,
  salvarOportunidade,
  type Empresa,
  type Oportunidade,
} from "./actions"
import { ChecklistHabilitacao } from "./checklist"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(valor: number): string {
  if (!valor) return "Não informado"
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  // "DD/MM/YYYY HH:MM:SS" → "DD/MM/YYYY"
  return dateStr.split(" ")[0]
}

function getModalidadeClass(modalidade: string): string {
  if (modalidade?.includes("Pregão")) return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  if (modalidade === "Dispensa") return "bg-amber-950/60 text-amber-300 border-amber-800/50"
  if (modalidade === "Concorrência") return "bg-violet-950/60 text-violet-300 border-violet-800/50"
  if (modalidade === "Inexigibilidade") return "bg-rose-950/60 text-rose-300 border-rose-800/50"
  if (modalidade === "Credenciamento") return "bg-cyan-950/60 text-cyan-300 border-cyan-800/50"
  return "bg-slate-800 text-slate-300 border-slate-700"
}

function getModalidadeClassDark(modalidade: string): string {
  if (modalidade?.includes("Pregão")) return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  if (modalidade === "Dispensa") return "bg-amber-950/60 text-amber-300 border-amber-800/50"
  if (modalidade === "Concorrência") return "bg-violet-950/60 text-violet-300 border-violet-800/50"
  if (modalidade === "Inexigibilidade") return "bg-rose-950/60 text-rose-300 border-rose-800/50"
  if (modalidade === "Credenciamento") return "bg-cyan-950/60 text-cyan-300 border-cyan-800/50"
  return "bg-slate-800 text-slate-300 border-slate-700"
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, label, dark = false }: { score: number; label: string; dark?: boolean }) {
  const cls = dark
    ? score >= 80
      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
      : score >= 60
        ? "bg-amber-950/60 text-amber-400 border-amber-800/50"
        : "bg-slate-800 text-slate-400 border-slate-700"
    : score >= 80
      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
      : score >= 60
        ? "bg-amber-950/60 text-amber-400 border-amber-800/50"
        : "bg-slate-700 text-slate-400 border-slate-600"

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      <Sparkles className="h-3 w-3" />
      {score} · {label}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-24 rounded-full bg-slate-700" />
        <div className="h-5 w-10 rounded-full bg-slate-700" />
        <div className="h-5 w-20 rounded-full bg-slate-700" />
      </div>
      <div className="h-4 w-3/4 rounded bg-slate-700" />
      <div className="h-4 w-1/2 rounded bg-slate-700" />
      <div className="h-3 w-2/3 rounded bg-slate-700" />
      <div className="flex justify-between pt-1">
        <div className="h-3 w-1/3 rounded bg-slate-700" />
        <div className="h-3 w-1/4 rounded bg-slate-700" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-8 flex-1 rounded-lg bg-slate-700" />
        <div className="h-8 w-10 rounded-lg bg-slate-700" />
      </div>
    </div>
  )
}

// ─── Opportunity card ─────────────────────────────────────────────────────────

function OportunidadeCard({
  op,
  salvo,
  salvando,
  onVerDetalhes,
  onSalvar,
}: {
  op: Oportunidade
  salvo: boolean
  salvando: boolean
  onVerDetalhes: () => void
  onSalvar: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 hover:shadow-md hover:border-slate-600 transition-all flex flex-col gap-3">
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <ScoreBadge score={op.score} label={op.scoreLabel} />
        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
          {op.uf}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${getModalidadeClass(op.modalidade)}`}
        >
          {op.modalidade}
        </span>
      </div>

      {/* Objeto */}
      <p className="text-sm font-medium text-slate-100 line-clamp-2 leading-snug">
        {op.objetoSemTags || op.objeto}
      </p>

      {/* Órgão */}
      <p className="text-xs text-slate-400 truncate">{op.orgao}</p>

      {/* Motivo */}
      <p className="text-xs italic text-slate-500 leading-snug">{op.motivo}</p>

      {/* Valor + data */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-200">
          {formatCurrency(op.valorTotalEstimado)}
        </span>
        <span>
          Enc.{" "}
          <span className="font-medium text-amber-400">
            {formatDate(op.dataFinalProposta)}
          </span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs border-slate-600 text-slate-200 hover:bg-slate-700"
          onClick={onVerDetalhes}
        >
          Ver detalhes
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant={salvo ? "outline" : "default"}
          className="text-xs px-3"
          disabled={salvo || salvando}
          onClick={onSalvar}
          style={!salvo ? { backgroundColor: "#1A5276" } : undefined}
          title={salvo ? "Já salva" : "Salvar oportunidade"}
        >
          {salvo ? (
            <Check className="h-3.5 w-3.5" />
          ) : salvando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BookmarkPlus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function DetalheSheet({
  op,
  empresaId,
  open,
  onOpenChange,
  salvo,
  salvando,
  onSalvar,
}: {
  op: Oportunidade | null
  empresaId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  salvo: boolean
  salvando: boolean
  onSalvar: () => void
}) {
  if (!op) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 border-slate-800">
        <SheetHeader>
          <SheetTitle className="text-white">Detalhes da Oportunidade</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Badges de score */}
          <div className="flex flex-wrap gap-2">
            <ScoreBadge score={op.score} label={op.scoreLabel} dark />
            <Badge variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
              {op.uf}
            </Badge>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${getModalidadeClassDark(op.modalidade)}`}
            >
              {op.modalidade}
            </span>
            <Badge variant="outline" className="border-slate-700 text-slate-400 bg-transparent">
              {op.portal}
            </Badge>
          </div>

          {/* Motivo */}
          <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">{op.scoreLabel}: </span>
            {op.motivo}
          </div>

          {/* Objeto */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Objeto
            </p>
            <p className="text-sm leading-relaxed text-slate-100">
              {op.objetoSemTags || op.objeto}
            </p>
          </div>

          <Separator className="bg-slate-800" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: "Órgão", value: op.orgao },
              { label: "Unidade Gestora", value: op.unidadeGestora },
              { label: "Processo", value: op.processo },
              { label: "UASG", value: op.uasg || "—" },
              { label: "CNPJ do Órgão", value: op.cnpj || "—" },
              { label: "Ranking CAPAG", value: op.rankingCapag || "—" },
              { label: "SRP", value: op.srpDescricao || "—" },
              {
                label: "Valor Estimado",
                value: formatCurrency(op.valorTotalEstimado),
                highlight: true,
              },
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p
                  className={`text-sm ${highlight ? "font-semibold text-white" : "text-slate-200"}`}
                >
                  {String(value)}
                </p>
              </div>
            ))}
          </div>

          <Separator className="bg-slate-800" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: "Publicação", value: formatDate(op.dataPublicacao) },
              { label: "Captura", value: formatDate(op.dataCaptura) },
              { label: "Início das propostas", value: formatDate(op.dataInicialProposta) },
              {
                label: "Encerramento",
                value: formatDate(op.dataFinalProposta),
                highlight: true,
              },
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p
                  className={`text-sm ${highlight ? "font-semibold text-red-400" : "text-slate-200"}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {(op.palavraEncontrada?.length ?? 0) > 0 && (
            <>
              <Separator className="bg-slate-800" />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Palavras-chave encontradas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {op.palavraEncontrada.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-slate-700 text-slate-300 bg-transparent">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {(op.anexos?.length ?? 0) > 0 && (
            <>
              <Separator className="bg-slate-800" />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Anexos ({op.anexos.length})
                </p>
                <div className="space-y-1.5">
                  {op.anexos.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{a.nome}</span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-slate-800" />

          <ChecklistHabilitacao empresaId={empresaId} />

          <Separator className="bg-slate-800" />

          <div className="flex flex-wrap gap-2 pb-4">
            {op.url && (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white bg-transparent"
                asChild
              >
                <a href={op.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Ver no portal
                </a>
              </Button>
            )}
            <Button
              size="sm"
              disabled={salvo || salvando}
              onClick={onSalvar}
              className={salvo ? "border-slate-700 text-slate-400 bg-transparent" : "bg-blue-600 hover:bg-blue-500 text-white"}
            >
              {salvo ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Oportunidade salva
                </>
              ) : salvando ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <BookmarkPlus className="mr-1.5 h-4 w-4" /> Salvar oportunidade
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function OportunidadesClient({ empresas }: { empresas: Empresa[] }) {
  const [empresaId, setEmpresaId] = useState("")
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [analisadas, setAnalisadas] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selecionada, setSelecionada] = useState<Oportunidade | null>(null)
  const [salvados, setSalvados] = useState<Set<number>>(new Set())
  const [salvandoId, setSalvandoId] = useState<number | null>(null)
  const [jaAcessado, setJaAcessado] = useState(false)

  const empresaSelecionada = empresas.find((e) => e.id === empresaId)

  function handleEmpresaChange(id: string) {
    setEmpresaId(id)
    setOportunidades([])
    setAnalisadas(0)
    setJaAcessado(true)
    startTransition(async () => {
      const result = await buscarOportunidades(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setOportunidades(result.oportunidades)
        setAnalisadas(result.analisadas)
      }
    })
  }

  async function handleSalvar(op: Oportunidade) {
    if (!empresaId) return
    setSalvandoId(op.idLicitacao)
    const result = await salvarOportunidade(empresaId, op, op.score)
    setSalvandoId(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      setSalvados((prev) => new Set([...prev, op.idLicitacao]))
      toast.success("Oportunidade salva com sucesso!")
    }
  }

  function handleVerDetalhes(op: Oportunidade) {
    setSelecionada(op)
    setSheetOpen(true)
  }

  return (
    <>
      {/* ── Empresa selector ── */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-medium text-slate-300">Empresa</p>
        </div>

        {empresas.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg bg-amber-950/50 border border-amber-800/50 p-3">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-300">
              Nenhuma empresa cadastrada.{" "}
              <a href="/clientes" className="font-semibold underline hover:text-amber-200">
                Cadastre uma empresa
              </a>{" "}
              para ver oportunidades.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={empresaId} onValueChange={handleEmpresaChange}>
              <SelectTrigger className="w-full sm:w-96 bg-slate-800 border-slate-600 text-white focus:ring-blue-500/30 [&>span]:text-white">
                <SelectValue placeholder="Selecione uma empresa..." className="text-slate-400" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {empresas.map((e) => (
                  <SelectItem
                    key={e.id}
                    value={e.id}
                    className="text-white focus:bg-slate-700 focus:text-white cursor-pointer"
                  >
                    <span className="font-medium">{e.razao_social}</span>
                    <span className="ml-2 text-xs text-slate-400">{e.porte}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {empresaSelecionada && (
              <p className="text-xs text-slate-400">
                CNAEs:{" "}
                <span className="font-mono text-slate-300">
                  {empresaSelecionada.cnae?.length
                    ? empresaSelecionada.cnae.join(", ")
                    : "não informado"}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Loading skeletons ── */}
      {isPending && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500">
              Buscando licitações dos últimos 5 dias e calculando relevância...
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {!isPending && jaAcessado && empresaId && (
        <>
          {oportunidades.length > 0 ? (
            <div>
              <p className="mb-4 text-sm text-slate-400">
                <span className="font-bold text-emerald-400">{oportunidades.length}</span>{" "}
                {oportunidades.length === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}{" "}
                para{" "}
                <span className="font-semibold text-white">
                  {empresaSelecionada?.razao_social}
                </span>
                {analisadas > 0 && (
                  <span className="text-slate-400">
                    {" "}
                    · {analisadas} licitações analisadas
                  </span>
                )}
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {oportunidades.map((op) => (
                  <OportunidadeCard
                    key={op.idLicitacao}
                    op={op}
                    salvo={salvados.has(op.idLicitacao)}
                    salvando={salvandoId === op.idLicitacao}
                    onVerDetalhes={() => handleVerDetalhes(op)}
                    onSalvar={() => handleSalvar(op)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-20 text-center">
              <Target className="mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">
                Nenhuma oportunidade relevante encontrada
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tente atualizar o CNAE ou o perfil da empresa em{" "}
                <a href="/clientes" className="text-blue-400 underline">
                  Clientes
                </a>
              </p>
              {analisadas > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {analisadas} licitações analisadas nos últimos 5 dias
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Initial empty state (no empresa selected) ── */}
      {!isPending && !jaAcessado && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-20 text-center">
          <Target className="mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">
            Selecione uma empresa para ver oportunidades
          </p>
          <p className="mt-1 text-xs text-slate-500">
            O sistema buscará licitações dos últimos 5 dias e calculará a
            relevância por CNAE e perfil
          </p>
        </div>
      )}

      {/* ── Detail sheet ── */}
      <DetalheSheet
        op={selecionada}
        empresaId={empresaId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        salvo={selecionada ? salvados.has(selecionada.idLicitacao) : false}
        salvando={selecionada ? salvandoId === selecionada.idLicitacao : false}
        onSalvar={() => selecionada && handleSalvar(selecionada)}
      />
    </>
  )
}
