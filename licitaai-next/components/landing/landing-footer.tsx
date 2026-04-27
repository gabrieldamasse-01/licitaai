import Link from "next/link"
import { Scale } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="bg-[#050D1A] text-slate-400 py-16 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/20">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">LicitaAI</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs text-center md:text-left">
              Inteligência artificial para encontrar, analisar e vencer licitações públicas brasileiras.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/sobre" className="text-sm text-slate-400 hover:text-white transition-colors">
              Sobre
            </Link>
            <a
              href="mailto:suporte@mgnext.com"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Contato
            </a>
            <Link href="/privacidade" className="text-sm text-slate-400 hover:text-white transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="text-sm text-slate-400 hover:text-white transition-colors">
              Termos
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-slate-500 text-sm">© 2026 LicitaAI. Todos os direitos reservados.</p>
            <p className="text-xs text-slate-600 mt-1">Desenvolvido por Gabriel Gomes Damasse</p>
          </div>
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            Sistemas Operacionais
          </span>
        </div>
      </div>
    </footer>
  )
}
