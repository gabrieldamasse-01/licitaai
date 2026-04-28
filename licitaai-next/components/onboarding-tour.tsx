"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight, Building2, Search, Sparkles, FileText, CheckCircle } from "lucide-react"

const TOUR_KEY = "licitaai_tour_done"

const steps = [
  {
    icon: "🎉",
    title: "Bem-vindo ao LicitaAI!",
    description: "Aqui você monitora licitações públicas com Inteligência Artificial, encontra oportunidades compatíveis com sua empresa e participa de processos com mais confiança.",
    color: "from-blue-500 to-cyan-500",
    LucideIcon: Sparkles,
  },
  {
    icon: "📋",
    title: "Clientes",
    description: "Cadastre sua empresa e informe os CNAEs (atividades econômicas) para personalizar as oportunidades que o sistema vai encontrar para você.",
    color: "from-violet-500 to-purple-600",
    LucideIcon: Building2,
  },
  {
    icon: "🔍",
    title: "Oportunidades",
    description: "Veja licitações compatíveis com sua empresa, cada uma com um score de compatibilidade calculado pelos seus CNAEs. Salve as mais interessantes para acompanhar.",
    color: "from-emerald-500 to-teal-600",
    LucideIcon: Search,
  },
  {
    icon: "🤖",
    title: "Análise com IA",
    description: "Clique em qualquer licitação e analise o edital completo com nossa IA. Ela resume os requisitos, prazos, exigências e tudo que você precisa saber.",
    color: "from-amber-500 to-orange-500",
    LucideIcon: Sparkles,
  },
  {
    icon: "📄",
    title: "Propostas",
    description: "Gere propostas comerciais completas com IA em segundos, baseadas no edital e no perfil da sua empresa. Economize horas de trabalho!",
    color: "from-pink-500 to-rose-600",
    LucideIcon: FileText,
  },
]

export function OnboardingTour() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem(TOUR_KEY)
      if (!done) setShow(true)
    }
  }, [])

  function finish() {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOUR_KEY, "1")
    }
    setShow(false)
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      finish()
    }
  }

  if (!show) return null

  const current = steps[step]
  const { LucideIcon } = current
  const isLast = step === steps.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(2,6,23,0.80)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{
          background: "rgba(15,23,42,0.97)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Botão pular */}
        <button
          onClick={finish}
          className="absolute right-4 top-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Pular tour
        </button>

        {/* Ícone com gradiente */}
        <div className="mb-6 flex justify-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${current.color} shadow-xl`}>
            <LucideIcon className="h-9 w-9 text-white" />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{current.icon}</span>
            <h2 className="text-xl font-bold text-white">{current.title}</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{current.description}</p>
        </div>

        {/* Indicador de progresso */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? "2rem" : "0.5rem",
                background:
                  i === step ? "#3b82f6" : i < step ? "#1e40af" : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
          <span className="ml-1 text-xs text-slate-600">{step + 1}/{steps.length}</span>
        </div>

        {/* Botão próximo / começar */}
        <button
          onClick={next}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500 active:scale-95"
        >
          {isLast ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Começar agora!
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
