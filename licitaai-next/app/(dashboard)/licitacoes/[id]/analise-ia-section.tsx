"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, FileText, X, Copy, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AcoesCard } from "./acoes-card"

type Empresa = { id: string; razao_social: string }

interface Props {
  licitacaoId: string
  sourceUrl: string | null
  status: string
  empresas: Empresa[]
  jaSalvasPorEmpresa: Set<string>
}

export function AnaliseIaSection({
  licitacaoId,
  sourceUrl,
  status,
  empresas,
  jaSalvasPorEmpresa,
}: Props) {
  const [analise, setAnalise] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  // Estado do modal de proposta
  const [modalAberto, setModalAberto] = useState(false)
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>(
    empresas.length === 1 ? empresas[0].id : ""
  )
  const [gerandoProposta, setGerandoProposta] = useState(false)
  const [proposta, setProposta] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  function handleAnalise(texto: string, cache: boolean) {
    setAnalise(texto)
    setFromCache(cache)
  }

  function abrirModal() {
    setProposta(null)
    setCopiado(false)
    setModalAberto(true)
  }

  async function handleGerarProposta() {
    if (!empresaSelecionada) {
      toast.error("Selecione uma empresa para gerar a proposta.")
      return
    }

    setGerandoProposta(true)
    setProposta(null)

    try {
      const res = await fetch("/api/gerar-proposta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licitacao_id: licitacaoId, company_id: empresaSelecionada }),
      })

      const data = await res.json() as { proposta?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error ?? "Erro ao gerar proposta.")
      } else {
        setProposta(data.proposta ?? null)
        toast.success("Proposta gerada com sucesso!")
      }
    } catch {
      toast.error("Erro de conexão ao gerar proposta.")
    } finally {
      setGerandoProposta(false)
    }
  }

  async function handleCopiar() {
    if (!proposta) return
    await navigator.clipboard.writeText(proposta)
    setCopiado(true)
    toast.success("Proposta copiada para a área de transferência!")
    setTimeout(() => setCopiado(false), 3000)
  }

  return (
    <>
      {/* Coluna direita — ações */}
      <div className="lg:col-span-1">
        <AcoesCard
          licitacaoId={licitacaoId}
          sourceUrl={sourceUrl}
          status={status}
          empresas={empresas}
          jaSalvasPorEmpresa={jaSalvasPorEmpresa}
          onAnalise={handleAnalise}
          onGerarProposta={abrirModal}
        />
      </div>

      {/* Card de Análise de IA — aparece após análise */}
      {analise && (
        <div className="lg:col-span-3 rounded-xl border border-violet-800/50 bg-violet-950/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                Análise de IA
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">~0.01 créditos</span>
              <Badge
                variant="outline"
                className={
                  fromCache
                    ? "bg-slate-800 text-slate-300 border-slate-600 text-xs"
                    : "bg-violet-900/60 text-violet-300 border-violet-700/50 text-xs"
                }
              >
                {fromCache ? "Cache" : "Novo"}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {analise}
          </p>
        </div>
      )}

      {/* Modal de proposta */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !gerandoProposta && setModalAberto(false)}
          />

          {/* Conteúdo do modal */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Gerar Proposta com IA</h2>
              </div>
              <button
                onClick={() => !gerandoProposta && setModalAberto(false)}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                disabled={gerandoProposta}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Seleção de empresa (quando há mais de uma) */}
              {!proposta && empresas.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Empresa para a proposta
                  </label>
                  <select
                    value={empresaSelecionada}
                    onChange={(e) => setEmpresaSelecionada(e.target.value)}
                    disabled={gerandoProposta}
                    className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    <option value="">Selecionar empresa...</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.razao_social}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Empresa única — só exibe */}
              {!proposta && empresas.length === 1 && (
                <div className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">Empresa</p>
                  <p className="text-sm font-medium text-slate-100">{empresas[0].razao_social}</p>
                </div>
              )}

              {/* Nenhuma empresa */}
              {!proposta && empresas.length === 0 && (
                <p className="text-sm text-slate-400">
                  Você precisa cadastrar uma empresa antes de gerar uma proposta.
                </p>
              )}

              {/* Loading */}
              {gerandoProposta && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <p className="text-sm">Gerando proposta... isso pode levar alguns segundos.</p>
                </div>
              )}

              {/* Proposta gerada */}
              {proposta && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Proposta Gerada
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                      onClick={handleCopiar}
                    >
                      {copiado ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar proposta
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
                    <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono text-[13px]">
                      {proposta}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!proposta && (
              <div className="px-6 py-4 border-t border-slate-700 shrink-0 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                  onClick={() => setModalAberto(false)}
                  disabled={gerandoProposta}
                >
                  Cancelar
                </Button>
                <Button
                  className="gap-2 bg-emerald-700 hover:bg-emerald-600 text-white"
                  onClick={handleGerarProposta}
                  disabled={gerandoProposta || !empresaSelecionada || empresas.length === 0}
                >
                  {gerandoProposta ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Gerar Proposta
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Footer quando proposta existe — opção de regerar */}
            {proposta && (
              <div className="px-6 py-4 border-t border-slate-700 shrink-0 flex justify-between items-center">
                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-white text-sm"
                  onClick={() => {
                    setProposta(null)
                    setCopiado(false)
                  }}
                  disabled={gerandoProposta}
                >
                  Gerar novamente
                </Button>
                <Button
                  className="text-slate-300 border-slate-600 hover:text-white hover:bg-slate-700"
                  variant="outline"
                  onClick={() => setModalAberto(false)}
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
