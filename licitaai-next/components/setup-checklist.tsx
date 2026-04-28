"use client"

import { CheckCircle2, Circle, ArrowRight, ChevronDown, ChevronUp, ListChecks } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface SetupChecklistProps {
  temEmpresa: boolean
  temEntrevista: boolean
  temPerfilValidado: boolean
  temDocumentos: boolean
}

const DISMISS_KEY = "licitaai_checklist_dismissed"

const itens = [
  { label: "Cadastrar primeira empresa", href: "/clientes", prop: "temEmpresa" as const },
  { label: "Completar entrevista de perfil", href: "/onboarding/entrevista", prop: "temEntrevista" as const },
  { label: "Validar perfil de licitações", href: "/onboarding/validar-perfil", prop: "temPerfilValidado" as const },
  { label: "Cadastrar documentos de habilitação", href: "/documentos", prop: "temDocumentos" as const },
  { label: "Ver suas primeiras oportunidades", href: "/oportunidades", prop: null },
]

export function SetupChecklist({
  temEmpresa,
  temEntrevista,
  temPerfilValidado,
  temDocumentos,
}: SetupChecklistProps) {
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") return !!localStorage.getItem(DISMISS_KEY)
    return false
  })

  const status: Record<string, boolean> = { temEmpresa, temEntrevista, temPerfilValidado, temDocumentos }

  const concluidos = itens.filter((item) => item.prop !== null && status[item.prop]).length
  const total = itens.length
  const pct = Math.round((concluidos / total) * 100)

  if (concluidos === total || dismissed) return null

  function dismiss() {
    if (typeof window !== "undefined") localStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden backdrop-blur-xl"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {/* Cabeçalho clicável */}
      <div className="flex items-center gap-3 p-5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-sm">
            <ListChecks className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Configure sua conta</p>
            <p className="text-xs text-slate-400">
              {concluidos} de {total} etapas concluídas — {pct}%
            </p>
          </div>
          <div className="ml-2 shrink-0 text-slate-500">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
        <button
          onClick={dismiss}
          className="shrink-0 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Dispensar
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Lista de itens */}
      {expanded && (
        <ul className="p-4 space-y-1">
          {itens.map((item) => {
            const feito = item.prop !== null ? status[item.prop] : false
            return (
              <li key={item.href}>
                {feito ? (
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-55">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm text-slate-400 line-through">{item.label}</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5 group"
                  >
                    <Circle className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    <span className="flex-1 text-sm text-slate-300 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-400 transition-all group-hover:translate-x-0.5 shrink-0" />
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
