"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, X } from "lucide-react"

export function ImpersonationBanner({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleStop() {
    startTransition(async () => {
      await fetch("/api/admin/stop-impersonate", { method: "POST" })
      router.push("/admin?tab=clientes")
      router.refresh()
    })
  }

  return (
    <div className="shrink-0 px-4 py-2 flex items-center justify-between gap-3 border-b" style={{ background: "rgba(217,119,6,0.2)", borderColor: "rgba(251,191,36,0.35)" }}>
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300 truncate">
          <span className="font-semibold">Modo visualização:</span> vendo como{" "}
          <span className="font-mono font-semibold text-amber-200">{email}</span>
          {" "}— somente leitura.
        </p>
      </div>
      <button
        onClick={handleStop}
        disabled={isPending}
        className="flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
        {isPending ? "Saindo..." : "Sair do modo admin"}
      </button>
    </div>
  )
}
