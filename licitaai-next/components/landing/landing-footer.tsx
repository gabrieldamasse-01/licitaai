import Link from "next/link"
import { Scale, Linkedin, Github, Mail } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="bg-[#050D1A] text-slate-400 py-16 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo + tagline */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Licita<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Inteligência artificial para encontrar, analisar e vencer licitações públicas brasileiras.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass-card border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/40 transition-all"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/gabrieldamasse-01/licitaai-dashboard-24"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass-card border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/40 transition-all"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:suporte@mgnext.com"
                className="w-9 h-9 rounded-lg glass-card border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/40 transition-all"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Produto */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Produto</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/auth/sign-up" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/auth/sign-up" className="text-sm text-slate-400 hover:text-white transition-colors">Licitações</Link>
              <Link href="/auth/sign-up" className="text-sm text-slate-400 hover:text-white transition-colors">Oportunidades</Link>
              <Link href="/auth/sign-up" className="text-sm text-slate-400 hover:text-white transition-colors">Propostas</Link>
              <Link href="#planos" className="text-sm text-slate-400 hover:text-white transition-colors">Preços</Link>
            </nav>
          </div>

          {/* Empresa */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Empresa</h4>
            <nav className="flex flex-col gap-3">
              <a href="mailto:contato@licitaai.com.br" className="text-sm text-slate-400 hover:text-white transition-colors">Sobre</a>
              <a href="mailto:contato@licitaai.com.br" className="text-sm text-slate-400 hover:text-white transition-colors">Contato</a>
              <a href="mailto:vendas@licitaai.com.br" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</a>
              <a href="mailto:vendas@licitaai.com.br" className="text-sm text-slate-400 hover:text-white transition-colors">Vendas Enterprise</a>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Legal</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/privacidade" className="text-sm text-slate-400 hover:text-white transition-colors">Política de Privacidade</Link>
              <Link href="/termos" className="text-sm text-slate-400 hover:text-white transition-colors">Termos de Uso</Link>
              <a href="mailto:suporte@mgnext.com" className="text-sm text-slate-400 hover:text-white transition-colors">Suporte</a>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 LicitaAI. Todos os direitos reservados.
            <span className="mx-2 text-slate-700">·</span>
            Desenvolvido por <span className="text-slate-400">Gabriel Gomes Damasse</span>
          </p>
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            Sistemas Operacionais
          </span>
        </div>
      </div>
    </footer>
  )
}
