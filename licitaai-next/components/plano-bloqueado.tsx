import Link from "next/link"
import { Lock } from "lucide-react"

export function PlanoBloqueado({ recurso }: { recurso: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700/50 mb-6">
        <Lock className="h-8 w-8 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        {recurso} é exclusivo do Plano Pro
      </h2>
      <p className="text-slate-400 text-sm max-w-sm mb-8">
        Faça upgrade para o Plano Pro e tenha acesso completo a todas as funcionalidades da plataforma.
      </p>
      <Link
        href="/#planos"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all"
      >
        Ver planos — a partir de R$97/mês
      </Link>
    </div>
  )
}
