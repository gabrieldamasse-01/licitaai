"use client"

import { useState } from "react"
import { Check, X, Star, Zap, Crown, ArrowRight, Shield } from "lucide-react"
import { motion } from "motion/react"

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
    descricao: "Para empresas que querem vencer mais licitações",
    icone: Star,
    destaque: true,
    badge: "Mais Popular" as string | null,
    recursos: [
      "UFs ilimitadas",
      "Licitações ilimitadas",
      "Checklist por edital",
      "Geração de proposta assistida",
      "Suporte prioritário via WhatsApp",
      "Relatório de mercado",
    ],
    recursos_nao: ["Curadoria humana", "Assessoria jurídica"],
  },
  {
    id: "enterprise" as const,
    nome: "Enterprise",
    preco: 997,
    precoFmt: "R$ 997",
    periodo: "/mês",
    descricao: "Para empresas sérias que focam em grandes pregões",
    icone: Crown,
    destaque: false,
    badge: "Completo" as string | null,
    recursos: [
      "Tudo do Profissional",
      "Curadoria humana semanal",
      "Assessoria para elaboração",
      "Análise jurídica antecipada",
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
    setStep("success")
    setTimeout(() => {
      onConfirm(plano.id)
    }, 1500)
  }

  const Icon = plano.icone

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050D1A]/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0A1628] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div
          className={`px-8 pt-8 pb-6 border-b border-white/5 bg-gradient-to-br ${
            plano.destaque ? "from-blue-600/20 to-cyan-400/10" : "from-slate-800/50 to-slate-900/50"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  plano.destaque ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-slate-800 text-blue-400"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assinando o Plano
                </p>
                <p className="text-xl font-bold text-white">
                  {plano.nome}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">
              {plano.precoFmt}
            </span>
            <span className="text-sm text-slate-400">
              {plano.periodo}
            </span>
          </div>
        </div>

        {step === "success" ? (
          <div className="px-8 py-12 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Plano ativado!
            </h3>
            <p className="text-slate-400 text-base">
              Seu plano <strong>{plano.nome}</strong> está pronto. Redirecionando para o seu dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            <p className="text-sm text-emerald-400 flex items-center justify-center gap-2 bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
              <Shield className="w-4 h-4" />
              Checkout 100% seguro via Stripe
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Nome no cartão
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 h-12 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  E-mail corporativo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@empresa.com.br"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 h-12 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Número do cartão
                </label>
                <input
                  type="text"
                  value={cartao}
                  onChange={(e) => setCartao(formatCartao(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 h-12 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Validade
                </label>
                <input
                  type="text"
                  value={validade}
                  onChange={(e) => setValidade(formatValidade(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 h-12 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 h-12 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 mt-4 mb-2 cursor-pointer group">
              <div className="relative flex items-start mt-0.5">
                <input
                  type="checkbox"
                  checked={aceito}
                  onChange={(e) => setAceito(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-slate-600 rounded bg-slate-900 checked:bg-blue-600 checked:border-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 focus:ring-offset-[#0A1628]"
                />
                <Check className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                Aceito os <span className="text-blue-400 underline">Termos</span> e  
                autorizo a cobrança de <strong className="text-white">{plano.precoFmt}/mês</strong>
              </span>
            </label>

            <button
              type="submit"
              disabled={!aceito || loading}
              className="w-full h-14 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none"
            >
              Confirmar Assinatura
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Planos Card Grid ─────────────────────────────────────────────────────────
export function LandingPlanos() {
  const [checkoutPlano, setCheckoutPlano] = useState<
    (typeof PLANOS_CONFIG)[number] | null
  >(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    window.location.href = "/auth/sign-up"
    setLoading(false)
  }

  return (
    <section className="py-24 bg-[#0A1628] relative" id="planos">
      
      {/* Background Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-sm font-medium mb-6 uppercase tracking-widest"
          >
            Preços transparentes
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white mt-3 mb-6"
          >
            Invista para <span className="text-blue-400">vencer mais</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Sem fidelidade. Cancele com um clique quando quiser.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {PLANOS_CONFIG.map((plano, index) => {
            const Icon = plano.icone
            const isDestaque = plano.destaque

            return (
              <motion.div
                key={plano.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={`relative rounded-3xl p-8 flex flex-col h-full ${
                  isDestaque
                    ? "bg-gradient-to-b from-blue-700 to-[#0A1628] border border-blue-500/50 shadow-2xl shadow-blue-900/50 scale-100 lg:scale-105 z-10"
                    : "glass-card border border-white/10"
                }`}
              >
                {/* Badge spotlight */}
                {isDestaque && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/30 uppercase tracking-widest border border-blue-400">
                    {plano.badge}
                  </div>
                )}

                {/* Header */}
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
                    <span className="text-4xl font-bold text-white">
                      {plano.precoFmt}
                    </span>
                    <span className={`text-sm ${isDestaque ? "text-blue-200" : "text-slate-500"}`}>
                      {plano.periodo}
                    </span>
                  </div>
                  <p className={`text-sm mt-3 ${isDestaque ? "text-blue-100" : "text-slate-400"}`}>
                    {plano.descricao}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-4 flex-1 mb-8">
                  {plano.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        isDestaque ? "bg-emerald-400/20 text-emerald-300" : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={`text-sm ${isDestaque ? "text-white" : "text-slate-300"}`}>
                        {r}
                      </span>
                    </li>
                  ))}
                  {plano.recursos_nao.map((r) => (
                    <li key={r} className="flex items-start gap-3 opacity-50">
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-800 text-slate-500">
                        <X className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-slate-500 line-through">
                        {r}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => setCheckoutPlano(plano)}
                  className={`w-full h-14 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base ${
                    isDestaque
                      ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg shadow-white/10"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  Selecionar Plano
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
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
