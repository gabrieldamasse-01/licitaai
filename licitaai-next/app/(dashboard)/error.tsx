"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 mb-2 border border-red-100">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <div className="space-y-2 mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Algo deu errado</h2>
        <p className="text-base text-slate-500 max-w-md mx-auto">
          {error.message || "Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi notificada."}
        </p>
      </div>
      <Button 
        onClick={reset} 
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-md shadow-blue-600/20 px-8"
      >
        Tentar novamente
      </Button>
    </div>
  )
}
