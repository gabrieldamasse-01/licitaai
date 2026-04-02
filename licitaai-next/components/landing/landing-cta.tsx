import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#1A5276] to-[#2E86C1]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Pronto para vencer mais licitações?
        </h2>
        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
          Cadastre-se grátis em menos de 2 minutos. Sem cartão de crédito
          necessário. Comece a encontrar oportunidades hoje mesmo.
        </p>
        <Link
          href="/auth/sign-up"
          className="inline-flex items-center gap-3 bg-white text-[#1A5276] font-bold px-10 py-5 rounded-xl text-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-xl hover:-translate-y-1"
        >
          Criar conta gratuita
          <ArrowRight className="w-6 h-6" />
        </Link>
        <p className="text-white/60 text-sm mt-6">
          Já tem uma conta?{" "}
          <Link
            href="/auth/login"
            className="text-white underline hover:no-underline"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </section>
  )
}
