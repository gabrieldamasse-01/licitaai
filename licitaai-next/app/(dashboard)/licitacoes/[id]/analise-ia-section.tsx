"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
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

  function handleAnalise(texto: string, cache: boolean) {
    setAnalise(texto)
    setFromCache(cache)
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
    </>
  )
}
