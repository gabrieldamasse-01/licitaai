"use client"

import { useState, useEffect, useTransition } from "react"
import { Bell, AlertTriangle, AlertCircle, Target, Sparkles, CheckCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { marcarComoLida, marcarTodasComoLidas } from "./actions"
import { cn } from "@/lib/utils"

type Notificacao = {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  link: string | null
  created_at: string
}

function IconeTipo({ tipo }: { tipo: string }) {
  if (tipo === "documento_vencendo")
    return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
  if (tipo === "documento_expirado")
    return <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
  if (tipo === "oportunidade_salva")
    return <Target className="h-5 w-5 text-violet-400 shrink-0" />
  return <Sparkles className="h-5 w-5 text-blue-400 shrink-0" />
}

function tempoRelativo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min atrás`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `${horas}h atrás`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return "ontem"
  return `${dias} dias atrás`
}

export default function NotificacoesPage() {
  const [todas, setTodas] = useState<Notificacao[]>([])
  const [filtro, setFiltro] = useState<"todas" | "nao_lidas">("todas")
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function fetchTodas() {
    const supabase = createClient()
    const { data } = await supabase
      .from("notifications")
      .select("id, tipo, titulo, mensagem, lida, link, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
    setTodas((data as Notificacao[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTodas()
  }, [])

  const exibidas = filtro === "nao_lidas" ? todas.filter((n) => !n.lida) : todas
  const naoLidas = todas.filter((n) => !n.lida).length

  function handleMarcarLida(id: string) {
    setTodas((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    startTransition(async () => { await marcarComoLida(id) })
  }

  function handleMarcarTodas() {
    setTodas((prev) => prev.map((n) => ({ ...n, lida: true })))
    startTransition(async () => { await marcarTodasComoLidas() })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Bell className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Notificações</h1>
            <p className="text-sm text-slate-400">
              {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? "s" : ""}` : "Tudo lido"}
            </p>
          </div>
        </div>
        {naoLidas > 0 && (
          <button
            onClick={handleMarcarTodas}
            disabled={isPending}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(["todas", "nao_lidas"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filtro === f
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700",
            )}
          >
            {f === "todas" ? "Todas" : `Não lidas${naoLidas > 0 ? ` (${naoLidas})` : ""}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">Carregando…</div>
        ) : exibidas.length === 0 ? (
          <div className="px-5 py-12 text-center space-y-2">
            <Bell className="h-10 w-10 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-500">
              {filtro === "nao_lidas" ? "Nenhuma notificação não lida." : "Nenhuma notificação ainda."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {exibidas.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors",
                  !n.lida && "bg-blue-500/5",
                  n.link && "cursor-pointer hover:bg-white/[0.03]",
                )}
                onClick={() => {
                  if (!n.lida) handleMarcarLida(n.id)
                  if (n.link) window.location.href = n.link
                }}
              >
                <div className="mt-0.5">
                  <IconeTipo tipo={n.tipo} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("text-sm font-medium", n.lida ? "text-slate-400" : "text-white")}>
                      {n.titulo}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-600 whitespace-nowrap">
                        {tempoRelativo(n.created_at)}
                      </span>
                      {!n.lida && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.mensagem}</p>
                </div>
                {!n.lida && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarcarLida(n.id)
                    }}
                    className="shrink-0 mt-0.5 text-xs text-slate-600 hover:text-slate-300 transition-colors whitespace-nowrap"
                  >
                    Marcar lida
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
