"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FileText, X, Copy, Check, Download, FileDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"
import { exportarPDF, exportarDOCX } from "@/lib/export-utils"

type PropostaRow = {
  id: string
  proposta_texto: string
  created_at: string
  licitacao_id: string
  company_id: string
  licitacoes: { objeto: string | null; orgao: string | null; uf: string | null } | null
  companies: { razao_social: string } | null
}

function truncate(text: string | null, max: number): string {
  if (!text) return "—"
  return text.length > max ? text.slice(0, max) + "…" : text
}

export function PropostasClient({ propostas }: { propostas: PropostaRow[] }) {
  const [selecionada, setSelecionada] = useState<PropostaRow | null>(null)
  const [textoEditado, setTextoEditado] = useState("")
  const [copiado, setCopiado] = useState(false)

  function abrirModal(p: PropostaRow) {
    setSelecionada(p)
    setTextoEditado(p.proposta_texto)
    setCopiado(false)
  }

  function fecharModal() {
    setSelecionada(null)
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(textoEditado)
    setCopiado(true)
    toast.success("Texto copiado!")
    setTimeout(() => setCopiado(false), 3000)
  }

  function handlePDF() {
    if (!selecionada) return
    const titulo = selecionada.licitacoes?.objeto ?? "Proposta Comercial"
    exportarPDF(textoEditado, titulo)
  }

  async function handleDOCX() {
    if (!selecionada) return
    const empresa = selecionada.companies?.razao_social ?? "Proposta"
    await exportarDOCX(textoEditado, `Proposta_${empresa}`.replace(/\s+/g, "_"))
    toast.success("Arquivo DOCX gerado!")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Propostas Geradas</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {propostas.length} {propostas.length === 1 ? "proposta" : "propostas"}
          </p>
        </div>
      </div>

      {/* Estado vazio */}
      {propostas.length === 0 && (
        <EmptyState
          icon="proposal"
          title="Nenhuma proposta gerada ainda"
          description={"Acesse uma licitação e clique em \"Gerar Proposta com IA\""}
          action={{ label: "Ver licitações", onClick: () => { window.location.href = '/licitacoes' } }}
        />
      )}

      {/* Lista de cards */}
      <div className="space-y-3">
        {propostas.map((p) => {
          const objeto = p.licitacoes?.objeto ?? "—"
          const orgao = p.licitacoes?.orgao ?? "—"
          const uf = p.licitacoes?.uf ?? ""
          const empresa = p.companies?.razao_social ?? "—"
          const data = format(parseISO(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

          return (
            <button
              key={p.id}
              onClick={() => abrirModal(p)}
              className="w-full text-left rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/80 hover:border-slate-600 transition-colors p-4"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-800/40">
                  <FileText className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white leading-snug">
                    {truncate(objeto, 80)}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    <span className="text-xs text-slate-400">{empresa}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{orgao}</span>
                    {uf && (
                      <>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{uf}</span>
                      </>
                    )}
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">{data}</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal */}
      {selecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={fecharModal}
          />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Proposta Completa</h2>
              </div>
              <button
                onClick={fecharModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {truncate(selecionada.licitacoes?.objeto ?? null, 100)}
                </p>
                <p className="text-xs text-slate-500">
                  {selecionada.companies?.razao_social} — {selecionada.licitacoes?.orgao} {selecionada.licitacoes?.uf ? `(${selecionada.licitacoes.uf})` : ""}
                </p>
              </div>

              <textarea
                value={textoEditado}
                onChange={(e) => setTextoEditado(e.target.value)}
                className="w-full min-h-[400px] rounded-lg bg-slate-800 border border-slate-600 text-white text-sm p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y leading-relaxed"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700 shrink-0 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handleCopiar}
                >
                  {copiado ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-400" />Copiado!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" />Copiar texto</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handlePDF}
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handleDOCX}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Exportar DOCX
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={fecharModal}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
