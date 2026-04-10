"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import {
  Search, SlidersHorizontal, ExternalLink, Loader2, X,
  AlertCircle, FileText, Bookmark, ChevronLeft, ChevronRight, Scale, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import {
  type Licitacao,
  type FetchResult,
  fetchLicitacoes,
  salvarLicitacao,
} from "./actions"

// ─── Constants ──────────────────────────────────────────────────────────────

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO",
  "MA","MT","MS","MG","PA","PB","PR","PE","PI",
  "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

const MODALIDADES = [
  "Pregão Eletrônico",
  "Dispensa",
  "Concorrência",
  "Credenciamento",
  "Inexigibilidade",
  "Tomada de Preços",
  "Convite",
]

const HISTORY_MAX = 5

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (!value || value === 0) return "Não informado"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    return format(parseISO(dateStr.split(" ")[0]), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return dateStr.split(" ")[0]
  }
}

function getModalidadeClass(modalidade: string): string {
  if (modalidade.includes("Pregão")) return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  if (modalidade === "Dispensa") return "bg-amber-950/60 text-amber-300 border-amber-800/50"
  if (modalidade === "Concorrência") return "bg-violet-950/60 text-violet-300 border-violet-800/50"
  if (modalidade === "Credenciamento") return "bg-cyan-950/60 text-cyan-300 border-cyan-800/50"
  if (modalidade === "Inexigibilidade") return "bg-rose-950/60 text-rose-300 border-rose-800/50"
  return "bg-slate-800 text-slate-300 border-slate-700"
}

function getPortalClass(portal: string): string {
  if (portal === "Supabase") return "bg-teal-950/60 text-teal-300 border-teal-800/50"
  if (portal === "Effecti") return "bg-indigo-950/60 text-indigo-300 border-indigo-800/50"
  if (portal.includes("PNCP")) return "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
  if (portal.includes("ComprasNet")) return "bg-blue-950/60 text-blue-300 border-blue-800/50"
  if (portal.includes("Compras Públicas")) return "bg-cyan-950/60 text-cyan-300 border-cyan-800/50"
  if (portal.includes("Licitações")) return "bg-orange-950/60 text-orange-300 border-orange-800/50"
  return "bg-slate-800 text-slate-300 border-slate-700"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-10 rounded-full bg-slate-700" />
        <div className="h-5 w-28 rounded-full bg-slate-700" />
        <div className="h-5 w-20 rounded-full bg-slate-700" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-4/5" />
      </div>
      <div className="h-3 bg-slate-700 rounded w-3/5" />
      <div className="flex justify-between items-center pt-2 border-t border-slate-700">
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-700 rounded w-28" />
          <div className="h-3 bg-slate-700 rounded w-20" />
        </div>
        <div className="h-8 w-28 bg-slate-700 rounded-md" />
      </div>
    </div>
  )
}

function LicitacaoCard({
  lic,
  onVerDetalhes,
}: {
  lic: Licitacao
  onVerDetalhes: () => void
}) {
  return (
    <article className="group flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-sm hover:shadow-md hover:border-slate-600 transition-all duration-200">
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-bold bg-slate-700 text-slate-300 border-slate-600">
          {lic.uf || "—"}
        </Badge>
        {lic.modalidade && (
          <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5", getModalidadeClass(lic.modalidade))}>
            {lic.modalidade}
          </Badge>
        )}
        {lic.portal && (
          <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5", getPortalClass(lic.portal))}>
            {lic.portal.replace("Portal Nacional de Contratações Públicas - ", "")}
          </Badge>
        )}
      </div>

      {/* Objeto */}
      <p className="text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed flex-1">
        {lic.objetoSemTags || "Sem descrição"}
      </p>

      {/* Órgão */}
      <p className="text-xs text-slate-400 truncate">
        {lic.orgao || "—"}
      </p>

      {/* Rodapé */}
      <div className="flex items-end justify-between gap-3 pt-3 border-t border-slate-700">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            {formatCurrency(lic.valorTotalEstimado)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Fecha: {formatDate(lic.dataFinalProposta)}
          </p>
        </div>
        <Button
          size="sm"
          onClick={onVerDetalhes}
          className="shrink-0 bg-[#1A5276] hover:bg-[#154360] text-white text-xs h-8 px-3 gap-1.5"
        >
          Ver detalhes
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </article>
  )
}

function DetalheConteudo({
  lic,
  onSalvar,
  isSaving,
}: {
  lic: Licitacao
  onSalvar: (l: Licitacao) => void
  isSaving: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-4 border-b border-slate-700 space-y-0">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="outline" className="text-xs font-bold bg-slate-700 text-slate-300 border-slate-600">{lic.uf}</Badge>
          {lic.modalidade && (
            <Badge variant="outline" className={cn("text-xs", getModalidadeClass(lic.modalidade))}>
              {lic.modalidade}
            </Badge>
          )}
          {lic.portal && (
            <Badge variant="outline" className={cn("text-xs", getPortalClass(lic.portal))}>
              {lic.portal.replace("Portal Nacional de Contratações Públicas - ", "")}
            </Badge>
          )}
        </div>
        <SheetTitle className="text-base font-semibold text-white leading-relaxed pr-6">
          {lic.objetoSemTags}
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto mt-4 space-y-5">
        {/* Grid de campos */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Órgão", value: lic.orgao },
            { label: "Processo", value: lic.processo },
            { label: "Publicação", value: formatDate(lic.dataPublicacao) },
            { label: "Abertura", value: formatDate(lic.dataInicialProposta) },
            { label: "Prazo para Submissão", value: formatDate(lic.dataFinalProposta) },
            { label: "Valor Estimado", value: formatCurrency(lic.valorTotalEstimado) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-sm text-slate-100 mt-0.5 font-medium break-words">{value || "—"}</p>
            </div>
          ))}
        </div>

        {/* Anexos */}
        {(lic.anexos?.length ?? 0) > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Documentos ({lic.anexos.length})
            </p>
            <ul className="space-y-1.5">
              {lic.anexos.map((a, i) => (
                <li key={i}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="break-all">{a.nome}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ações fixas no rodapé */}
      <div className="flex gap-3 pt-4 border-t border-slate-700 mt-4">
        <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <a href={lic.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Acessar Edital
          </a>
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 border-slate-600 text-slate-200 hover:bg-slate-700"
          onClick={() => onSalvar(lic)}
          disabled={isSaving}
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
          ) : (
            <><Bookmark className="h-4 w-4" />Salvar</>
          )}
        </Button>
      </div>
    </div>
  )
}

function Paginacao({
  pagina,
  total,
  onMudar,
}: {
  pagina: number
  total: number
  onMudar: (p: number) => void
}) {
  if (total <= 1) return null

  const radius = 2
  const start = Math.max(0, pagina - radius)
  const end = Math.min(total - 1, pagina + radius)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 sm:h-8 sm:w-8 shrink-0"
        disabled={pagina === 0}
        onClick={() => onMudar(pagina - 1)}
      >
        <ChevronLeft className="h-4 w-4 sm:h-3 sm:w-3" />
      </Button>

      {start > 0 && (
        <>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex h-8 w-8 text-xs" onClick={() => onMudar(0)}>1</Button>
          {start > 1 && <span className="hidden sm:inline-block text-slate-400 text-sm px-1">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Button
          key={p}
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-8 text-xs hidden sm:inline-flex",
            p === pagina && "bg-[#1A5276] text-white border-[#1A5276] hover:bg-[#154360] hover:text-white"
          )}
          onClick={() => onMudar(p)}
        >
          {p + 1}
        </Button>
      ))}

      {end < total - 1 && (
        <>
          {end < total - 2 && <span className="hidden sm:inline-block text-slate-500 text-sm px-1">…</span>}
          <Button variant="outline" size="sm" className="hidden sm:inline-flex h-8 w-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => onMudar(total - 1)}>
            {total}
          </Button>
        </>
      )}

      {/* Mobile only page status */}
      <span className="sm:hidden text-sm text-slate-400 font-medium px-3">
        Pág {pagina + 1} de {total}
      </span>

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 sm:h-8 sm:w-8 shrink-0"
        disabled={pagina >= total - 1}
        onClick={() => onMudar(pagina + 1)}
      >
        <ChevronRight className="h-4 w-4 sm:h-3 sm:w-3" />
      </Button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LicitacoesClient({ dadosIniciais }: { dadosIniciais: FetchResult }) {
  const [dados, setDados] = useState<FetchResult>(dadosIniciais)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [paginaAtual, setPaginaAtual] = useState(0)
  const [texto, setTexto] = useState("")
  const [ufsSel, setUfsSel] = useState<Set<string>>(new Set(UFS))
  const [modsSel, setModsSel] = useState<Set<string>>(new Set(MODALIDADES))
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [detalhe, setDetalhe] = useState<Licitacao | null>(null)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()

  // ─── Histórico de busca ───────────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<string[]>([])
  const [showHistorico, setShowHistorico] = useState(false)

  useEffect(() => {
    const client = createClient()
    client.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null
      setUserId(id)
      if (id) {
        try {
          const stored = localStorage.getItem(`licitacoes-search-history-${id}`)
          if (stored) setHistorico(JSON.parse(stored))
        } catch { /* ignore */ }
      }
    })
  }, [])

  function salvarHistorico(termo: string) {
    if (!termo.trim() || !userId) return
    const atualizado = [termo, ...historico.filter((h) => h !== termo)].slice(0, HISTORY_MAX)
    setHistorico(atualizado)
    localStorage.setItem(`licitacoes-search-history-${userId}`, JSON.stringify(atualizado))
  }

  function removerHistorico(termo: string) {
    const atualizado = historico.filter((h) => h !== termo)
    setHistorico(atualizado)
    if (userId) localStorage.setItem(`licitacoes-search-history-${userId}`, JSON.stringify(atualizado))
  }

  // ─── Buscar ───────────────────────────────────────────────────────────────
  function buscar(pagina = 0, buscaOverride?: string) {
    const buscaTerm = buscaOverride ?? texto
    if (buscaTerm.trim()) salvarHistorico(buscaTerm.trim())
    setShowHistorico(false)
    startTransition(async () => {
      const uf = ufsSel.size === 1 ? [...ufsSel][0] : undefined
      const modalidades = modsSel.size > 0 && modsSel.size < MODALIDADES.length ? [...modsSel] : undefined
      const result = await fetchLicitacoes({
        pagina,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        uf,
        modalidades,
        busca: buscaTerm || undefined,
      })
      setDados(result)
      setPaginaAtual(pagina)
      if (result.error) toast.error(result.error)
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }

  function handleSalvar(lic: Licitacao) {
    startSaveTransition(async () => {
      const result = await salvarLicitacao(lic)
      if (result && "error" in result) toast.error(result.error)
      else toast.success("Licitação salva no banco de dados!")
    })
  }

  function toggleUF(uf: string) {
    setUfsSel((prev) => {
      const next = new Set(prev)
      if (next.has(uf)) { next.delete(uf) } else { next.add(uf) }
      return next
    })
  }

  function toggleMod(m: string) {
    setModsSel((prev) => {
      const next = new Set(prev)
      if (next.has(m)) { next.delete(m) } else { next.add(m) }
      return next
    })
  }

  function limparFiltros() {
    setUfsSel(new Set(UFS))
    setModsSel(new Set(MODALIDADES))
    setTexto("")
    setDataInicio("")
    setDataFim("")
  }

  const totalPaginas = dados.pagination?.total_paginas ?? 0
  const totalRegistros = dados.pagination?.total_registros ?? 0
  const totalBanco = dados.total_banco ?? 0
  const ufsAtivas = ufsSel.size > 0 && ufsSel.size < UFS.length ? 1 : 0
  const modsAtivas = modsSel.size > 0 && modsSel.size < MODALIDADES.length ? 1 : 0
  const filtrosAtivos = ufsAtivas + modsAtivas + (texto ? 1 : 0) + (dataInicio ? 1 : 0) + (dataFim ? 1 : 0)

  // Painel de filtros (reutilizado em desktop + Sheet mobile)
  const painelFiltros = (
    <div className="space-y-6">
      {/* Busca por texto */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Busca</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
          <Input
            placeholder="Objeto ou órgão..."
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setShowHistorico(!e.target.value)
            }}
            onFocus={() => { if (!texto) setShowHistorico(true) }}
            onBlur={() => setTimeout(() => setShowHistorico(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && buscar(0)}
            className="pl-8 h-9 text-sm bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
          />
          {/* Dropdown histórico */}
          {showHistorico && historico.length > 0 && !texto && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-slate-600 bg-slate-800 shadow-xl overflow-hidden">
              {historico.map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors group"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span
                    className="flex-1 text-sm text-slate-300 truncate cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setTexto(h)
                      setShowHistorico(false)
                      buscar(0, h)
                    }}
                  >
                    {h}
                  </span>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      removerHistorico(h)
                    }}
                    className="p-0.5 text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Período */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Período <span className="normal-case font-normal text-slate-400">(publicação)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">De</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-9 text-sm bg-slate-800 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">Até</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-9 text-sm bg-slate-800 border-slate-600 text-white"
            />
          </div>
        </div>
        <Button
          onClick={() => { buscar(0); setFiltrosOpen(false) }}
          className="w-full bg-[#1A5276] hover:bg-[#154360] text-white h-9 text-sm gap-2"
          disabled={isPending}
        >
          {isPending ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Buscando...</>
          ) : (
            <><Search className="h-3.5 w-3.5" />Buscar</>
          )}
        </Button>
      </div>

      {/* UF */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estado</p>
          <button
            onClick={() => setUfsSel(ufsSel.size === UFS.length ? new Set() : new Set(UFS))}
            className="text-xs px-2 py-0.5 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 transition-colors"
          >
            {ufsSel.size === UFS.length ? "Desmarcar todos" : "Selecionar todos"}
          </button>
        </div>
        <div className="max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-1">
          <div className="grid grid-cols-5 gap-1">
            {UFS.map((uf) => (
              <button
                key={uf}
                onClick={() => toggleUF(uf)}
                className={cn(
                  "flex items-center justify-center w-7 h-7 text-[10px] font-medium rounded-md border transition-colors",
                  ufsSel.has(uf)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-800 text-slate-400 border-slate-600 hover:border-blue-500 hover:text-blue-400"
                )}
              >
                {uf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-slate-700" />

      {/* Modalidade */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Modalidade</p>
          <button
            onClick={() => setModsSel(modsSel.size === MODALIDADES.length ? new Set() : new Set(MODALIDADES))}
            className="text-xs px-2 py-0.5 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 transition-colors"
          >
            {modsSel.size === MODALIDADES.length ? "Desmarcar todos" : "Selecionar todos"}
          </button>
        </div>
        <div className="max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-1">
          <div className="space-y-0.5">
            {MODALIDADES.map((m) => (
              <div
                key={m}
                className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-slate-700/40 transition-colors"
                onClick={() => toggleMod(m)}
              >
                <Checkbox
                  checked={modsSel.has(m)}
                  onCheckedChange={() => toggleMod(m)}
                  className="data-[state=checked]:bg-[#1A5276] data-[state=checked]:border-[#1A5276]"
                />
                <span className="text-xs text-slate-300 select-none">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Limpar tudo */}
      {filtrosAtivos > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={limparFiltros}
          className="w-full text-slate-500 text-xs h-8 gap-1.5"
        >
          <X className="h-3 w-3" />
          Limpar {filtrosAtivos} filtro{filtrosAtivos !== 1 ? "s" : ""}
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Licitações</h1>
            {totalBanco > 0 && (
              <Badge className="text-xs bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-700">
                {totalBanco.toLocaleString("pt-BR")} no banco
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {isPending
              ? "Buscando licitações..."
              : totalRegistros > 0
              ? `${totalRegistros.toLocaleString("pt-BR")} encontradas${filtrosAtivos > 0 ? " com filtros" : ""}`
              : "Nenhuma licitação encontrada"}
          </p>
        </div>

        {/* Botão FAB filtros — mobile */}
        <Sheet open={filtrosOpen} onOpenChange={setFiltrosOpen}>
          <div className="lg:hidden fixed bottom-20 right-4 z-40">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
              onClick={() => setFiltrosOpen(true)}
            >
              <SlidersHorizontal className="h-6 w-6" />
              {filtrosAtivos > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white border-2 border-white shadow-sm">
                  {filtrosAtivos}
                </span>
              )}
            </Button>
          </div>
          <SheetContent side="left" className="w-[85vw] sm:w-80 overflow-y-auto bg-slate-900 border-slate-800">
            <SheetHeader className="mb-5">
              <SheetTitle className="text-white">Filtros</SheetTitle>
            </SheetHeader>
            {painelFiltros}
          </SheetContent>
        </Sheet>
      </div>

      {/* Layout principal */}
      <div className="flex gap-6">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-6 rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-sm">
            {painelFiltros}
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Erro */}
          {dados.error && !isPending && (
            <div className="rounded-xl border border-red-800/50 bg-red-950/50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">{dados.error}</p>
                <button
                  onClick={() => buscar(paginaAtual)}
                  className="text-xs text-red-400 hover:underline mt-1"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Skeletons */}
          {isPending && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Estado vazio */}
          {!isPending && !dados.error && dados.licitacoes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-20 text-center">
              <Scale className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">
                {filtrosAtivos > 0
                  ? "Nenhuma licitação corresponde aos filtros"
                  : "Nenhuma licitação encontrada"}
              </p>
              {filtrosAtivos > 0 && (
                <button
                  onClick={limparFiltros}
                  className="mt-3 text-xs text-blue-400 hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Cards */}
          {!isPending && dados.licitacoes.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {dados.licitacoes.map((lic) => (
                <LicitacaoCard
                  key={`${lic.idLicitacao}-${lic.processo}`}
                  lic={lic}
                  onVerDetalhes={() => {
                    setDetalhe(lic)
                    setDetalheOpen(true)
                  }}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {!isPending && totalPaginas > 1 && (
            <Paginacao
              pagina={paginaAtual}
              total={totalPaginas}
              onMudar={(p) => buscar(p)}
            />
          )}
        </div>
      </div>

      {/* Sheet de detalhes */}
      <Sheet open={detalheOpen} onOpenChange={setDetalheOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-6 bg-slate-900 border-slate-800">
          {detalhe && (
            <DetalheConteudo
              lic={detalhe}
              onSalvar={handleSalvar}
              isSaving={isSaving}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
