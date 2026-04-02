"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Bot, Target, Shield, Search } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#050D1A]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" 
             style={{ opacity: 0.05 }} />
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
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Nova versão 2.0 com IA Generativa
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
          >
            Vença licitações com{" "}
            <br className="hidden md:block" />
            <span className="gradient-text-hero">Inteligência Artificial</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A plataforma completa e automatizada para buscar, analisar e gerenciar 
            oportunidades do ComprasNet. Ganhe tempo e aumente muito suas taxas de conversão.
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
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] btn-glow transition-all"
            >
              Começar grátis agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#como-funciona"
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-lg glass-card transition-all"
            >
              Entenda como a IA atua
            </Link>
          </motion.div>
          
          {/* Trust indicators */}
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.8, delay: 0.8 }}
             className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-500 font-medium"
          >
             <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500"/> Segurança de dados</div>
             <div className="hidden sm:flex items-center gap-2"><Target className="h-4 w-4 text-blue-400"/> Score de probabilidade</div>
          </motion.div>
        </div>

        {/* Dashboard Preview Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          {/* Mockup Container */}
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
                {/* Highlight Card */}
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

                {/* Normal Cards */}
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
