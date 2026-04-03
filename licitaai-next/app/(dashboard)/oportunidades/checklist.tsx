"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ClipboardList, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buscarChecklistDocumentos, type ChecklistItem } from "./actions"

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function ItemRow({ item }: { item: ChecklistItem }) {
  if (item.status === "ok") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-green-950/50 border border-green-800/50 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-300 truncate">{item.nome}</p>
          {item.validade && (
            <p className="text-xs text-green-500">Válido até {formatDate(item.validade)}</p>
          )}
        </div>
        <span className="text-xs font-semibold text-green-400 shrink-0">OK</span>
      </div>
    )
  }

  if (item.status === "vencendo") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-amber-950/50 border border-amber-800/50 px-3 py-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-300 truncate">{item.nome}</p>
          <p className="text-xs text-amber-500">Vence em {formatDate(item.validade)} — renovar em breve</p>
        </div>
        <span className="text-xs font-semibold text-amber-400 shrink-0">Atenção</span>
      </div>
    )
  }

  if (item.status === "vencido") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-950/50 border border-red-800/50 px-3 py-2">
        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-300 truncate">{item.nome}</p>
          <p className="text-xs text-red-500">Venceu em {formatDate(item.validade)}</p>
        </div>
        <span className="text-xs font-semibold text-red-400 shrink-0">Vencido</span>
      </div>
    )
  }

  // faltando
  return (
    <div className="flex items-center gap-3 rounded-lg bg-red-950/30 border border-red-900/50 border-dashed px-3 py-2">
      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-300 truncate">{item.nome}</p>
        <p className="text-xs text-slate-400">Não cadastrado</p>
      </div>
      <span className="text-xs font-semibold text-red-400 shrink-0">Falta</span>
    </div>
  )
}

export function ChecklistHabilitacao({
  empresaId,
}: {
  empresaId: string
}) {
  const [itens, setItens] = useState<ChecklistItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!empresaId) return
    setItens(null)
    setError(null)
    buscarChecklistDocumentos(empresaId).then((res) => {
      if (res.error) setError(res.error)
      else setItens(res.itens)
    })
  }, [empresaId])

  if (!empresaId) return null

  if (!itens && !error) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Verificando documentos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 py-2">{error}</p>
    )
  }

  const ok = itens!.filter((i) => i.status === "ok").length
  const total = itens!.length
  const pct = Math.round((ok / total) * 100)

  const barColor =
    pct === 100
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-amber-400"
        : "bg-red-400"

  const faltando = itens!.filter((i) => i.status === "faltando" || i.status === "vencido")

  return (
    <div className="space-y-4">
      {/* Header + resumo */}
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Checklist de Habilitação
        </p>
      </div>

      {/* Progresso */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-300">
            <span className={ok === total ? "text-green-400" : "text-white"}>
              {ok}
            </span>{" "}
            de {total} documentos em ordem
          </p>
          <span className="text-xs font-semibold text-slate-400">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {itens!.map((item) => (
          <ItemRow key={item.nome} item={item} />
        ))}
      </div>

      {/* CTA */}
      {faltando.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-dashed border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          asChild
        >
          <a href="/documentos">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Cadastrar {faltando.length === 1 ? "documento faltante" : `${faltando.length} documentos faltantes`}
          </a>
        </Button>
      )}
    </div>
  )
}
