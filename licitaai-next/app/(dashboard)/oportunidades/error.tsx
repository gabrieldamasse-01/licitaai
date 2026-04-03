"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function OportunidadesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-950/50 border border-red-800/50">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">Erro ao carregar oportunidades</h2>
        <p className="text-sm text-slate-400">
          {error.message || "Não foi possível buscar as oportunidades. Tente novamente."}
        </p>
      </div>
      <Button onClick={reset} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
        Tentar novamente
      </Button>
    </div>
  )
}
