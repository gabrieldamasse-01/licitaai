"use client"

import { useState } from "react"
import { Check, X, Star, Zap, Crown, ArrowRight, Shield } from "lucide-react"

// ─── Plan data ────────────────────────────────────────────────────────────────
const PLANOS_CONFIG = [
  {
    id: "essencial" as const,
    nome: "Essencial",
    preco: 197,
    precoFmt: "R$ 197",
    periodo: "/mês",
    descricao: "Para empresas começando no mundo das licitações",
    icone: Zap,
    destaque: false,
    badge: null as string | null,
    recursos: [
      "Até 3 UFs monitoradas",
      "20 licitações ranqueadas/semana",
      "Upload de documentos gerais",
      "Notificações por e-mail",
      "Suporte por e-mail",
    ],
    recursos_nao: [
      "Checklist por edital",
      "Geração de proposta assistida",
      "Curadoria humana",
    ],
  },
  {
    id: "profissional" as const,
    nome: "Profissional",
    preco: 497,
    precoFmt: "R$ 497",
    periodo: "/mês",
    descricao: "Para empresas ativas que querem vencer mais licitações",
    icone: Star,
    destaque: true,
    badge: "Mais Popular" as string | null,
    recursos: [
      "UFs ilimitadas",
      "Licitações ilimitadas",
      "Checklist por edital",
      "Geração de proposta assistida",
      "Suporte prioritário por WhatsApp",
      "Relatório mensal de atividade",
    ],
    recursos_nao: ["Curadoria humana", "Assessoria de proposta"],
  },
  {
    id: "enterprise" as const,
    nome: "Enterprise",
    preco: 997,
    precoFmt: "R$ 997",
    periodo: "/mês",
    descricao: "Para empresas sérias que querem resultados máximos",
    icone: Crown,
    destaque: false,
    badge: "Completo" as string | null,
    recursos: [
      "Tudo do Profissional",
      "Curadoria humana semanal (top 5 editais)",
      "Assessoria para elaboração de proposta",
      "Análise jurídica sob demanda",
      "Relatório trimestral de ROI",
      "Gestor de conta dedicado",
    ],
    recursos_nao: [] as string[],
  },
]

// ─── Checkout Modal ────────────────────────────────────────────────────────────
interface CheckoutModalProps {
  plano: (typeof PLANOS_CONFIG)[number]
  onClose: () => void
  onConfirm: (planoId: string) => void
  loading?: boolean
}

function CheckoutModal({ plano, onClose, onConfirm, loading = false }: CheckoutModalProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [cartao, setCartao] = useState("")
  const [validade, setValidade] = useState("")
  const [cvv, setCvv] = useState("")
  const [aceito, setAceito] = useState(false)
  const [step, setStep] = useState<"form" | "success">("form")

  const formatCartao = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 16)
    return d.replace(/(\d{4})(?=\d)/g, "$1 ")
  }
  const formatValidade = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4)
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`
    return d
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aceito) return
    // Placeholder: in production this would call Stripe/Asaas
    setStep("success")
    setTimeout(() => {
      onConfirm(plano.id)
    }, 1500)
  }

  const Icon = plano.icone

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div
          className={`px-8 pt-8 pb-6 ${plano.destaque ? "bg-[#1A5276]" : plano.id === "enterprise" ? "bg-gray-900" : "bg-gray-50"}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${plano.destaque ? "bg-white/20" : "bg-white"}`}
              >
                <Icon
                  className={`w-5 h-5 ${plano.destaque ? "text-white" : plano.id === "enterprise" ? "text-gray-900" : "text-[#1A5276]"}`}
                />
              </div>
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${plano.destaque || plano.id === "enterprise" ? "text-white/60" : "text-gray-500"}`}
                >
                  Plano
                </p>
                <p
                  className={`text-xl font-bold ${plano.destaque || plano.id === "enterprise" ? "text-white" : "text-gray-900"}`}
                >
                  {plano.nome}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ${plano.destaque || plano.id === "enterprise" ? "text-white/60 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span
              className={`text-4xl font-bold ${plano.destaque || plano.id === "enterprise" ? "text-white" : "text-gray-900"}`}
            >
              {plano.precoFmt}
            </span>
            <span
              className={`text-sm ${plano.destaque || plano.id === "enterprise" ? "text-white/60" : "text-gray-500"}`}
            >
              {plano.periodo}
            </span>
          </div>
        </div>

        {step === "success" ? (
          <div className="px-8 py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Plano ativado!
            </h3>
            <p className="text-gray-500 text-sm">
              Seu plano <strong>{plano.nome}</strong> foi ativado com sucesso.
              Redirecionando...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              Pagamento seguro — integração com Stripe/Asaas em breve
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nome no cartão
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@empresa.com"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Número do cartão
                </label>
                <input
                  type="text"
                  value={cartao}
                  onChange={(e) => setCartao(formatCartao(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Validade
                </label>
                <input
                  type="text"
                  value={validade}
                  onChange={(e) => setValidade(formatValidade(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="123"
                  maxLength={4}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={aceito}
                onChange={(e) => setAceito(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#1A5276] border-gray-300 focus:ring-[#2E86C1]"
              />
              <span className="text-xs text-gray-500">
                Concordo com os{" "}
                <span className="text-[#2E86C1] underline cursor-pointer">
                  Termos de Uso
                </span>{" "}
                e autorizo a cobrança de{" "}
                <strong>{plano.precoFmt}/mês</strong>
              </span>
            </label>

            <button
              type="submit"
              disabled={!aceito || loading}
              className="w-full bg-[#1A5276] text-white font-semibold py-3 rounded-xl hover:bg-[#154360] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              <Shield className="w-4 h-4" />
              Assinar plano {plano.nome}
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-gray-400">
              Cancele a qualquer momento · Sem fidelidade
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Planos Card Grid ─────────────────────────────────────────────────────────
export function LandingPlanos() {
  const [checkoutPlano, setCheckoutPlano] = useState<
    (typeof PLANOS_CONFIG)[number] | null
  >(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (_planoId: string) => {
    setLoading(true)
    // In production: call payment API, then redirect to sign-up or dashboard
    window.location.href = "/auth/sign-up"
    setLoading(false)
  }

  return (
    <section className="py-24 bg-white" id="planos">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#2E86C1] uppercase tracking-widest">
            Preços transparentes
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
            Escolha o plano ideal para sua empresa
          </h2>
          <p className="text-xl text-gray-500">
            Sem contratos longos. Cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANOS_CONFIG.map((plano) => {
            const Icon = plano.icone
            const isDestaque = plano.destaque
            const isDark = plano.id === "enterprise"

            return (
              <div
                key={plano.id}
                className={`relative rounded-3xl p-8 flex flex-col transition-all ${
                  isDestaque
                    ? "bg-[#1A5276] text-white shadow-2xl scale-105 ring-4 ring-[#2E86C1]/30"
                    : isDark
                      ? "bg-gray-900 text-white shadow-xl"
                      : "bg-white border-2 border-gray-100 shadow-sm hover:border-[#2E86C1]/40 hover:shadow-md"
                }`}
              >
                {/* Badge */}
                {plano.badge && (
                  <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg ${
                      isDestaque ? "bg-[#27AE60]" : "bg-gray-700"
                    }`}
                  >
                    {plano.badge}
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isDestaque || isDark ? "bg-white/15" : "bg-[#1A5276]/10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isDestaque || isDark ? "text-white" : "text-[#1A5276]"
                        }`}
                      />
                    </div>
                    <p
                      className={`text-sm font-bold uppercase tracking-wider ${
                        isDestaque || isDark ? "text-white/70" : "text-gray-500"
                      }`}
                    >
                      {plano.nome}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        isDestaque || isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plano.precoFmt}
                    </span>
                    <span
                      className={`text-sm ${
                        isDestaque || isDark ? "text-white/50" : "text-gray-400"
                      }`}
                    >
                      {plano.periodo}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-2 leading-snug ${
                      isDestaque || isDark ? "text-white/60" : "text-gray-500"
                    }`}
                  >
                    {plano.descricao}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-8">
                  {plano.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isDestaque
                            ? "text-green-300"
                            : isDark
                              ? "text-green-400"
                              : "text-[#27AE60]"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isDestaque || isDark ? "text-white/80" : "text-gray-600"
                        }`}
                      >
                        {r}
                      </span>
                    </li>
                  ))}
                  {plano.recursos_nao.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 opacity-40">
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-current" />
                      <span
                        className={`text-sm line-through ${
                          isDestaque || isDark
                            ? "text-white/50"
                            : "text-gray-400"
                        }`}
                      >
                        {r}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => setCheckoutPlano(plano)}
                  className={`text-center font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                    isDestaque
                      ? "bg-white text-[#1A5276] hover:bg-blue-50 shadow-lg"
                      : isDark
                        ? "bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                        : "bg-[#1A5276] text-white hover:bg-[#154360]"
                  }`}
                >
                  Assinar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {checkoutPlano && (
        <CheckoutModal
          plano={checkoutPlano}
          onClose={() => setCheckoutPlano(null)}
          onConfirm={handleConfirm}
          loading={loading}
        />
      )}
    </section>
  )
}
