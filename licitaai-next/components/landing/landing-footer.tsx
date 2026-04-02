export function LandingFooter() {
  return (
    <footer className="bg-[#0D3B5E] text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#2E86C1] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold">
                Licita<span className="text-[#5DADE2]">IA</span>
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Plataforma de inteligência artificial para licitações públicas no
              Brasil.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">
              Produto
            </h4>
            <ul className="space-y-2">
              {["Funcionalidades", "Planos", "Integrações", "API"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">
              Empresa
            </h4>
            <ul className="space-y-2">
              {["Sobre nós", "Blog", "Carreiras", "Contato"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">
              Legal
            </h4>
            <ul className="space-y-2">
              {["Termos de Uso", "Privacidade", "LGPD"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © 2026 LicitaIA. Todos os direitos reservados.
          </p>
          <p className="text-white/40 text-sm">São Paulo, SP · Brasil</p>
        </div>
      </div>
    </footer>
  )
}
