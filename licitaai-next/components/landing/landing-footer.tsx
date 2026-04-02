import { Shield } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="bg-[#050D1A] text-slate-400 py-16 border-t border-white/5 relative overflow-hidden">
      {/* Background glow lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Shield className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Licita<span className="text-blue-400">IA</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
              A plataforma definitiva de inteligência artificial para potencializar 
              análises e acelerar vitórias em licitações públicas no Brasil.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors">
                {/* Placeholder x Icon */}
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors">
                {/* Placeholder ln Icon */}
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors">
                {/* Placeholder meta Icon */}
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white tracking-wide">Produto</h4>
            <ul className="space-y-4">
              {["Funcionalidades", "Planos e Preços", "Integrações", "Casos de Sucesso"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white text-sm transition-colors block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white tracking-wide">Empresa</h4>
            <ul className="space-y-4">
              {["Sobre nós", "Blog", "Carreiras", "Contato"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white text-sm transition-colors block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-white tracking-wide">Legal</h4>
            <ul className="space-y-4">
              {["Termos de Uso", "Política de Privacidade", "Acordo de LGPD"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white text-sm transition-colors block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm flex items-center gap-2">
            © {new Date().getFullYear()} LicitaIA. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              Sistemas Operacionais
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
