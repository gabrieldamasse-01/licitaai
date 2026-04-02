"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import {
  Search, SlidersHorizontal, ExternalLink, Loader2, X,
  AlertCircle, FileText, Bookmark, ChevronLeft, ChevronRight, Scale,
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
  if (modalidade.includes("Pregão")) return "bg-blue-50 text-blue-700 border-blue-200"
  if (modalidade === "Dispensa") return "bg-amber-50 text-amber-700 border-amber-200"
  if (modalidade === "Concorrência") return "bg-violet-50 text-violet-700 border-violet-200"
  if (modalidade === "Credenciamento") return "bg-cyan-50 text-cyan-700 border-cyan-200"
  if (modalidade === "Inexigibilidade") return "bg-rose-50 text-rose-700 border-rose-200"
  return "bg-slate-50 text-slate-600 border-slate-200"
}

function getPortalClass(portal: string): string {
  if (portal.includes("PNCP")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (portal.includes("ComprasNet")) return "bg-blue-50 text-blue-700 border-blue-200"
  if (portal.includes("Compras Públicas")) return "bg-cyan-50 text-cyan-700 border-cyan-200"
  if (portal.includes("Licitações")) return "bg-orange-50 text-orange-700 border-orange-200"
  return "bg-slate-50 text-slate-600 border-slate-200"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-10 rounded-full bg-slate-200" />
        <div className="h-5 w-28 rounded-full bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-4/5" />
      </div>
      <div className="h-3 bg-slate-200 rounded w-3/5" />
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-3 bg-slate-200 rounded w-20" />
        </div>
        <div className="h-8 w-28 bg-slate-200 rounded-md" />
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
    <article className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-bold bg-slate-50 text-slate-700 border-slate-300">
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
        <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
          {lic.portal || "PNCP"}
        </Badge>
      </div>

      {/* Objeto */}
      <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-relaxed flex-1">
        {lic.objetoSemTags || "Sem descrição"}
      </p>

      {/* Órgão */}
      <p className="text-xs text-slate-500 truncate">
        {lic.orgao || lic.unidadeGestora || "—"}
      </p>

      {/* Rodapé */}
      <div className="flex items-end justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
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
      <SheetHeader className="pb-4 border-b border-slate-100 space-y-0">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="outline" className="text-xs font-bold bg-slate-50 text-slate-700">{lic.uf}</Badge>
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
        <SheetTitle className="text-base font-semibold text-slate-900 leading-relaxed pr-6">
          {lic.objetoSemTags}
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto mt-4 space-y-5">
        {/* Grid de campos */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Órgão", value: lic.orgao || lic.unidadeGestora },
            { label: "Processo", value: lic.processo },
            { label: "Publicação", value: formatDate(lic.dataPublicacao) },
            { label: "Abertura", value: formatDate(lic.dataInicialProposta) },
            { label: "Encerramento", value: formatDate(lic.dataFinalProposta) },
            { label: "Valor Estimado", value: formatCurrency(lic.valorTotalEstimado) },
            { label: "SRP", value: lic.srpDescricao || "—" },
            { label: "CAPAG", value: lic.rankingCapag || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-sm text-slate-800 mt-0.5 font-medium break-words">{value || "—"}</p>
            </div>
          ))}
        </div>

        {/* Palavras encontradas */}
        {(lic.palavraEncontrada?.length ?? 0) > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Palavras encontradas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lic.palavraEncontrada.map((p) => (
                <Badge key={p} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        )}

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
                    className="flex items-start gap-2 text-xs text-[#2E86C1] hover:text-[#1A5276] hover:underline"
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
      <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
        <Button asChild className="flex-1 bg-[#1A5276] hover:bg-[#154360] text-white gap-2">
          <a href={lic.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Acessar Edital
          </a>
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
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
        className="h-8 w-8"
        disabled={pagina === 0}
        onClick={() => onMudar(pagina - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {start > 0 && (
        <>
          <Button variant="outline" size="sm" className="h-8 w-8 text-xs" onClick={() => onMudar(0)}>1</Button>
          {start > 1 && <span className="text-slate-400 text-sm px-1">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Button
          key={p}
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-8 text-xs",
            p === pagina && "bg-[#1A5276] text-white border-[#1A5276] hover:bg-[#154360] hover:text-white"
          )}
          onClick={() => onMudar(p)}
        >
          {p + 1}
        </Button>
      ))}

      {end < total - 1 && (
        <>
          {end < total - 2 && <span className="text-slate-400 text-sm px-1">…</span>}
          <Button variant="outline" size="sm" className="h-8 w-8 text-xs" onClick={() => onMudar(total - 1)}>
            {total}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={pagina >= total - 1}
        onClick={() => onMudar(pagina + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LicitacoesClient({
  dadosIniciais,
  dataInicioDefault,
  dataFimDefault,
}: {
  dadosIniciais: FetchResult
  dataInicioDefault: string
  dataFimDefault: string
}) {
  const [dados, setDados] = useState<FetchResult>(dadosIniciais)
  const [dataInicio, setDataInicio] = useState(dataInicioDefault)
  const [dataFim, setDataFim] = useState(dataFimDefault)
  const [paginaAtual, setPaginaAtual] = useState(0)
  const [texto, setTexto] = useState("")
  const [ufsSel, setUfsSel] = useState<Set<string>>(new Set())
  const [modsSel, setModsSel] = useState<Set<string>>(new Set())
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [detalhe, setDetalhe] = useState<Licitacao | null>(null)
  const [detalheOpen, setDetalheOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()

  const licitacoesFiltradas = useMemo(() => {
    let r = dados.licitacoes ?? []
    if (ufsSel.size > 0) r = r.filter((l) => ufsSel.has(l.uf))
    if (modsSel.size > 0) r = r.filter((l) => modsSel.has(l.modalidade))
    if (texto.trim()) {
      const q = texto.toLowerCase()
      r = r.filter(
        (l) =>
          l.objetoSemTags?.toLowerCase().includes(q) ||
          l.orgao?.toLowerCase().includes(q)
      )
    }
    return r
  }, [dados.licitacoes, ufsSel, modsSel, texto])

  function buscar(pagina = 0) {
    startTransition(async () => {
      const uf = ufsSel.size === 1 ? [...ufsSel][0] : undefined
      const modalidades = modsSel.size > 0 ? [...modsSel] : undefined
      const result = await fetchLicitacoes({ dataInicio, dataFim, pagina, uf, modalidades })
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
    setUfsSel(new Set())
    setModsSel(new Set())
    setTexto("")
  }

  const totalPaginas = dados.pagination?.total_paginas ?? 0
  const totalRegistros = dados.pagination?.total_registros ?? 0
  const filtrosAtivos = ufsSel.size + modsSel.size + (texto ? 1 : 0)

  // Painel de filtros (reutilizado em desktop + Sheet mobile)
  const painelFiltros = (
    <div className="space-y-6">
      {/* Busca */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Busca</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Objeto ou órgão..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Período */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Período <span className="normal-case font-normal text-slate-400">(máx. 5 dias)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">De</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">Até</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-9 text-sm"
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
          {ufsSel.size > 0 && (
            <button
              onClick={() => setUfsSel(new Set())}
              className="text-[10px] text-[#2E86C1] hover:underline"
            >
              Limpar ({ufsSel.size})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {UFS.map((uf) => (
            <button
              key={uf}
              onClick={() => toggleUF(uf)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-medium border transition-colors",
                ufsSel.has(uf)
                  ? "bg-[#1A5276] text-white border-[#1A5276]"
                  : "bg-white text-slate-600 border-slate-300 hover:border-[#2E86C1] hover:text-[#2E86C1]"
              )}
            >
              {uf}
            </button>
          ))}
        </div>
      </div>

      {/* Modalidade */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Modalidade</p>
          {modsSel.size > 0 && (
            <button
              onClick={() => setModsSel(new Set())}
              className="text-[10px] text-[#2E86C1] hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="space-y-2.5">
          {MODALIDADES.map((m) => (
            <div
              key={m}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleMod(m)}
            >
              <Checkbox
                checked={modsSel.has(m)}
                onCheckedChange={() => toggleMod(m)}
                className="data-[state=checked]:bg-[#1A5276] data-[state=checked]:border-[#1A5276]"
              />
              <span className="text-sm text-slate-700 select-none">{m}</span>
            </div>
          ))}
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Licitações</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isPending
              ? "Buscando licitações..."
              : totalRegistros > 0
              ? `${totalRegistros.toLocaleString("pt-BR")} no período • ${licitacoesFiltradas.length} exibidas`
              : "Nenhuma licitação encontrada"}
          </p>
        </div>

        {/* Botão filtros — mobile */}
        <Sheet open={filtrosOpen} onOpenChange={setFiltrosOpen}>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden gap-2"
            onClick={() => setFiltrosOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A5276] text-[10px] font-bold text-white">
                {filtrosAtivos}
              </span>
            )}
          </Button>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader className="mb-5">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            {painelFiltros}
          </SheetContent>
        </Sheet>
      </div>

      {/* Layout principal */}
      <div className="flex gap-6">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {painelFiltros}
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Erro */}
          {dados.error && !isPending && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{dados.error}</p>
                <button
                  onClick={() => buscar(paginaAtual)}
                  className="text-xs text-red-600 hover:underline mt-1"
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
          {!isPending && !dados.error && licitacoesFiltradas.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <Scale className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                {filtrosAtivos > 0
                  ? "Nenhuma licitação corresponde aos filtros"
                  : "Nenhuma licitação encontrada neste período"}
              </p>
              {filtrosAtivos > 0 ? (
                <button
                  onClick={limparFiltros}
                  className="mt-3 text-xs text-[#2E86C1] hover:underline"
                >
                  Limpar filtros
                </button>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Ajuste o período e clique em Buscar
                </p>
              )}
            </div>
          )}

          {/* Cards */}
          {!isPending && licitacoesFiltradas.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {licitacoesFiltradas.map((lic) => (
                <LicitacaoCard
                  key={lic.idLicitacao}
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
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-6">
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
