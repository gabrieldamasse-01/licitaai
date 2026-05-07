"use client"

import { useEffect, useRef, useState } from "react"

interface LandingNumerosProps {
  totalLicitacoes: number
  totalUfs: number
}

const portais = [
  { nome: "Effecti", descricao: "Portal de licitações" },
  { nome: "PNCP", descricao: "Portal Nacional de Contratações Públicas" },
]

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (target === 0) return

    function startAnimation() {
      startRef.current = null
      function step(ts: number) {
        if (startRef.current === null) startRef.current = ts
        const elapsed = ts - startRef.current
        const progress = Math.min(elapsed / duration, 1)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startAnimation()
          observerRef.current?.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      observerRef.current?.disconnect()
    }
  }, [target, duration])

  return { value, containerRef }
}

function AnimatedStat({
  target,
  label,
  sublabel,
  prefix = "",
  suffix = "",
  staticValue,
}: {
  target: number
  label: string
  sublabel: string
  prefix?: string
  suffix?: string
  staticValue?: string
}) {
  const { value, containerRef } = useCountUp(target)

  const display = staticValue
    ? staticValue
    : `${prefix}${target > 0 ? value.toLocaleString("pt-BR") : "—"}${suffix}`

  return (
    <div
      ref={containerRef}
      className="relative text-center p-8 rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-900/10 to-transparent hover:border-blue-500/40 hover:from-blue-900/20 transition-all duration-300 group overflow-hidden"
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: "inset 0 0 40px rgba(59,130,246,0.06)" }} />
      <div className="text-4xl md:text-5xl font-black mb-2 tabular-nums bg-gradient-to-br from-white to-blue-200 bg-clip-text text-transparent">
        {display}
      </div>
      <div className="text-base font-semibold text-slate-200 mb-1">{label}</div>
      <div className="text-sm text-slate-500">{sublabel}</div>
    </div>
  )
}

export function LandingNumeros({ totalLicitacoes, totalUfs }: LandingNumerosProps) {
  return (
    <section className="py-24 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12">
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Plataforma usada por empresas que faturam com o governo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <AnimatedStat
            target={totalLicitacoes}
            label="Licitações monitoradas"
            sublabel="coletadas automaticamente"
          />
          <AnimatedStat
            target={totalUfs}
            label="UFs cobertas"
            sublabel="cobertura nacional"
            staticValue={totalUfs > 0 ? String(totalUfs) : "26+"}
          />
          <AnimatedStat
            target={portais.length}
            label="Portais integrados"
            sublabel={portais.map((p) => p.nome).join(" + ")}
          />
        </div>
      </div>
    </section>
  )
}
