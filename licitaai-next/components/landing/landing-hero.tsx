import Link from "next/link"
import { ArrowRight, Shield, Target } from "lucide-react"

interface LandingHeroProps {
  totalLicitacoes: number
}

export function LandingHero({ totalLicitacoes }: LandingHeroProps) {
  const formatted = totalLicitacoes > 0
    ? totalLicitacoes.toLocaleString("pt-BR")
    : "15.000+"

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#050D1A]">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            {formatted} licitações monitoradas
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Nunca mais perca{" "}
            <br className="hidden md:block" />
            uma{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              licitação
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            IA que monitora, analisa e gera propostas para licitações públicas no Brasil.
            Integração com Effecti e PNCP — cobertura nacional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center rounded-full text-white font-semibold text-lg transition-all btn-primary-gradient"
            >
              Começar gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-lg transition-all"
            >
              Ver demonstração
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Segurança de dados
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              Score de compatibilidade
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
