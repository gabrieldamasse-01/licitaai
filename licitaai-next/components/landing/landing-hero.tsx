"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Shield, Target, Search, Bot } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#050D1A]">
      {/* Animated radial gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] animate-pulse-slow"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.3), transparent)",
          }}
        />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/10 blur-[80px] rounded-full" />

        {/* Decorative blur circles */}
        <svg className="absolute top-20 left-10 opacity-30" width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="60" fill="url(#blob1)" />
          <defs>
            <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        <svg className="absolute top-40 right-20 opacity-20" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" fill="url(#blob2)" />
          <defs>
            <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        <svg className="absolute bottom-32 right-1/3 opacity-20" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="30" fill="url(#blob3)" />
          <defs>
            <radialGradient id="blob3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.04]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-blue-500/30 text-blue-300 text-sm font-medium mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
            13.411 licitações monitoradas agora
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight text-white mb-6 leading-[1.05]"
          >
            Ganhe mais{" "}
            <br className="hidden md:block" />
            <span className="gradient-text-hero">licitações</span>{" "}
            <br className="hidden md:block" />
            com IA.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            O LicitaAI monitora o PNCP 24h, pontua cada edital pelo perfil da sua empresa
            e avisa quando aparecer uma oportunidade real — sem você precisar procurar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center rounded-full text-white font-semibold text-lg bg-gradient-to-r from-blue-600 to-violet-600 shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_30px_rgba(99,102,241,0.6)] hover:scale-[1.02] transition-all duration-200"
            >
              Começar gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#como-funciona"
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-lg glass-card transition-all"
            >
              Ver demonstração
            </Link>
          </motion.div>

          {/* Social proof below buttons */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-5 text-sm text-slate-500"
          >
            Usado por empresas em <span className="text-slate-300 font-medium">27 estados</span> — sem cartão de crédito
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500 font-medium"
          >
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /> Segurança de dados</div>
            <div className="hidden sm:flex items-center gap-2"><Target className="h-4 w-4 text-blue-400" /> Score de probabilidade</div>
          </motion.div>
        </div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-slate-800 bg-[#0A1628]/80 backdrop-blur-xl shadow-2xl overflow-hidden animate-float">
            {/* Header/Nav Mock */}
            <div className="h-12 border-b border-slate-800/50 flex items-center px-4 gap-4 bg-slate-900/50">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-700" />
                <div className="h-3 w-3 rounded-full bg-slate-700" />
                <div className="h-3 w-3 rounded-full bg-slate-700" />
              </div>
              <div className="h-6 flex-1 max-w-md rounded-md bg-slate-800/50 flex items-center px-3">
                <Search className="h-3 w-3 text-slate-500 mr-2" />
                <div className="h-2 w-32 bg-slate-700/50 rounded-full" />
              </div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sidebar Mock */}
              <div className="hidden md:block space-y-4">
                <div className="h-8 w-2/3 bg-slate-800/50 rounded-lg" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-full bg-slate-800/30 rounded-md" />
                  ))}
                </div>
              </div>

              {/* Main Content Mock */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-900/10 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-1/3 bg-blue-400/20 rounded" />
                      <div className="h-5 w-16 bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center rounded-full font-bold">98% Match</div>
                    </div>
                    <div className="h-3 w-3/4 bg-slate-700/50 rounded" />
                    <div className="h-3 w-1/2 bg-slate-700/50 rounded" />
                  </div>
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-800/20 flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-800/50 shrink-0" />
                    <div className="space-y-2 w-full">
                      <div className="h-4 w-1/3 bg-slate-700 rounded" />
                      <div className="h-3 w-2/3 bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
