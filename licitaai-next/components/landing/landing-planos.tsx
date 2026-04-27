import Link from "next/link"
import { Check, X, Zap, Star, Crown, ArrowRight } from "lucide-react"

const PLANOS_CONFIG = [
  {
    id: "gratuito",
    nome: "Gratuito",
    precoFmt: "R$ 0",
    periodo: "/mês",
    descricao: "Para quem quer descobrir o poder do LicitaAI sem compromisso",
    icone: Zap,
    destaque: false,
    badge: null as string | null,
    recursos: [
      "1 empresa cadastrada",
      "50 oportunidades por mês",
      "Score de relevância por CNAE",
      "Alertas por email (básico)",
    ],
    recursos_nao: [
      "Checklist de habilitação",
      "Geração de proposta com IA",
      "Relatórios detalhados",
      "Suporte prioritário",
    ],
    cta: "Começar grátis",
    ctaHref: "/auth/sign-up",
  },
  {
    id: "pro",
    nome: "Pro",
    precoFmt: "R$ 97",
    periodo: "/mês",
    descricao: "Para empresas que levam licitações a sério",
    icone: Star,
    destaque: true,
    badge: "Mais Popular" as string | null,
    recursos: [
      "Empresas ilimitadas",
      "Oportunidades ilimitadas",
      "Score de relevância por CNAE",
      "Checklist de habilitação automático",
      "Geração de proposta com IA",
      "Alertas de vencimento de documentos",
      "Relatórios e métricas em tempo real",
      "Suporte por email prioritário",
    ],
    recursos_nao: [] as string[],
    cta: "Assinar Pro",
    ctaHref: "/configuracoes#plano",
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    precoFmt: "Sob consulta",
    periodo: "",
    descricao: "Para grandes empresas e consultorias de licitações",
    icone: Crown,
    destaque: false,
    badge: "Personalizado" as string | null,
    recursos: [
      "Tudo do plano Pro",
      "Integração via API",
      "SLA garantido",
      "Gestor de conta dedicado",
      "Treinamento para equipe",
      "Relatório de ROI trimestral",
    ],
    recursos_nao: [] as string[],
    cta: "Falar com vendas",
    ctaHref: "mailto:suporte@mgnext.com",
  },
]

export function LandingPlanos() {
  return (
    <section className="py-24 bg-[#050D1A] relative" id="planos">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-sm font-medium mb-6 uppercase tracking-widest">
            Preços transparentes
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-3 mb-6">
            Escolha o plano{" "}
            <span className="text-blue-400">ideal para você</span>
          </h2>
          <p className="text-lg text-slate-300">
            Comece grátis. Faça upgrade quando quiser. Sem fidelidade — cancele com um clique.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {PLANOS_CONFIG.map((plano) => {
            const Icon = plano.icone
            const isDestaque = plano.destaque

            return (
              <div
                key={plano.id}
                className={`relative rounded-3xl p-8 flex flex-col h-full transition-all duration-300 ${
                  isDestaque
                    ? "bg-gradient-to-b from-blue-700 to-[#0A1628] border border-blue-500/50 shadow-2xl shadow-blue-900/50 lg:scale-105 z-10"
                    : "border border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                {plano.badge && (
                  <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border ${
                      isDestaque
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-blue-400"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {plano.badge}
                  </div>
                )}

                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDestaque ? "bg-white text-blue-600" : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p
                      className={`text-sm font-bold uppercase tracking-wider ${
                        isDestaque ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {plano.nome}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plano.precoFmt}</span>
                    {plano.periodo && (
                      <span className={`text-sm ${isDestaque ? "text-blue-200" : "text-slate-500"}`}>
                        {plano.periodo}
                      </span>
                    )}
                  </div>
                  <p className={`text-base mt-3 ${isDestaque ? "text-blue-100" : "text-slate-300"}`}>
                    {plano.descricao}
                  </p>
                </div>

                <ul className="space-y-4 flex-1 mb-8">
                  {plano.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isDestaque
                            ? "bg-emerald-400/20 text-emerald-300"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-sm ${isDestaque ? "text-white" : "text-slate-300"}`}>
                        {r}
                      </span>
                    </li>
                  ))}
                  {plano.recursos_nao.map((r) => (
                    <li key={r} className="flex items-start gap-3 opacity-40">
                      <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 text-slate-500">
                        <X className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm text-slate-500 line-through">{r}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plano.ctaHref}
                  className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base ${
                    isDestaque
                      ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg shadow-white/10"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {plano.cta}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
