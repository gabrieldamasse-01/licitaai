import Link from "next/link"
import { ArrowRight, Shield } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#050D1A]">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10 p-12 lg:p-20 rounded-[3rem] border border-white/10 bg-white/[0.03] shadow-2xl">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
          Comece agora e veja as licitações{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            que você está perdendo
          </span>
        </h2>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Sem burocracia, sem cartão de crédito exigido no cadastro. Comece
          a encontrar e analisar oportunidades agora mesmo.
        </p>

        <div className="flex flex-col items-center gap-6">
          <Link
            href="/auth/sign-up"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-3 bg-blue-600 text-white font-bold px-10 h-16 rounded-2xl text-lg hover:bg-blue-500 active:scale-95 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]"
          >
            Criar conta gratuita
            <ArrowRight className="w-6 h-6" />
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-6 mt-2">
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <Shield className="w-4 h-4 text-blue-400" />
              Conexão 100% Segura
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-sm text-slate-400">
              Já tem conta?{" "}
              <Link
                href="/auth/login"
                className="text-white hover:text-blue-400 font-medium transition-colors border-b border-transparent hover:border-blue-400"
              >
                Fazer login
              </Link>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
