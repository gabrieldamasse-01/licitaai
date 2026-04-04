"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import {
  Bell,
  Target,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  CheckCheck,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { marcarComoLida, marcarTodasComoLidas } from "@/app/(dashboard)/notificacoes/actions"
import { cn } from "@/lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Notificacao = {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  link: string | null
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function IconeTipo({ tipo }: { tipo: string }) {
  if (tipo === "documento_vencendo")
    return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
  if (tipo === "documento_expirado")
    return <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
  if (tipo === "oportunidade_salva")
    return <Target className="h-4 w-4 text-violet-400 shrink-0" />
  return <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NotificationsBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isPending, startTransition] = useTransition()

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  // Fetch inicial
  async function fetchNotificacoes() {
    const supabase = createClient()
    const { data } = await supabase
      .from("notifications")
      .select("id, tipo, titulo, mensagem, lida, link, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
    if (data) setNotificacoes(data as Notificacao[])
  }

  // Supabase Realtime
  useEffect(() => {
    fetchNotificacoes()

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotificacoes()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMarcarLida(id: string) {
    // Otimista: marca localmente de imediato
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
    )
    startTransition(async () => {
      await marcarComoLida(id)
    })
  }

  function handleMarcarTodas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    startTransition(async () => {
      await marcarTodasComoLidas()
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.07] hover:text-white transition-colors"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 bg-slate-800 border-slate-700 shadow-2xl"
      >
        {/* Header do dropdown */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-semibold text-white">
            Notificações
            {naoLidas > 0 && (
              <span className="ml-2 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                {naoLidas}
              </span>
            )}
          </span>
          {naoLidas > 0 && (
            <button
              onClick={handleMarcarTodas}
              disabled={isPending}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-[360px] overflow-y-auto">
          {notificacoes.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma notificação</p>
            </div>
          ) : (
            notificacoes.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.lida) handleMarcarLida(n.id)
                  if (n.link) {
                    setOpen(false)
                    window.location.href = n.link
                  }
                }}
                className={cn(
                  "w-full text-left flex items-start gap-3 px-4 py-3 border-b border-slate-700/50 last:border-0 transition-colors hover:bg-white/[0.04]",
                  !n.lida && "bg-blue-500/5",
                )}
              >
                <div className="mt-0.5">
                  <IconeTipo tipo={n.tipo} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium leading-snug truncate", n.lida ? "text-slate-400" : "text-white")}>
                    {n.titulo}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {n.mensagem}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">{tempoRelativo(n.created_at)}</p>
                </div>
                {!n.lida && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-4 py-2.5">
          <Link
            href="/notificacoes"
            onClick={() => setOpen(false)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver todas as notificações →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
