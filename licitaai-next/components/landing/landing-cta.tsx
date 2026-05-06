"use client"

import Link from "next/link"
import { ArrowRight, Shield, Zap } from "lucide-react"
import { motion } from "motion/react"

export function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0A1628]">
      {/* Vibrant gradient background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/25 blur-[100px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-blue-500/15 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[200px] bg-cyan-500/10 blur-[60px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="glass-card p-12 lg:p-20 rounded-[3rem] border border-white/10 shadow-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8">
            <Zap className="h-3.5 w-3.5" />
            Comece hoje mesmo
          </div>

          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">
            Sua concorrência já está{" "}
            <br className="hidden md:block" />
            usando IA.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">E você?</span>
          </h2>

          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            Sem burocracia, sem cartão de crédito no cadastro. Em menos de 5 minutos você já
            recebe as primeiras oportunidades pontuadas para a sua empresa.
          </p>

          <p className="text-sm text-slate-500 mb-10">
            <span className="text-emerald-400 font-semibold">47 empresas</span> se cadastraram esta semana
          </p>

          <div className="flex flex-col items-center gap-6">
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-3 font-bold px-10 h-16 rounded-2xl text-lg text-white bg-gradient-to-r from-blue-600 to-violet-600 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-200 animate-pulse-cta"
            >
              Criar minha conta grátis
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
        </motion.div>
      </div>
    </section>
  )
}
