"use client"

import { Target, FileCheck, BellRing, BarChart3, Clock, Shield } from "lucide-react"
import { motion } from "motion/react"

const problemas = [
  {
    numero: "R$ 2,1 bi",
    label: "em contratos perdidos por falta de monitoramento ativo",
    icon: "📉",
  },
  {
    numero: "73%",
    label: "das empresas perdem prazos de habilitação por desorganização",
    icon: "⏱️",
  },
  {
    numero: "8h/dia",
    label: "gastos manualmente vasculhando editais — sem garantia de resultado",
    icon: "😮‍💨",
  },
]

const features = [
  {
    icon: Target,
    title: "Score por CNAE",
    description: "Cada edital recebe uma nota de 0 a 100% baseada no perfil da sua empresa. Você vê primeiro o que tem mais chance de ganhar.",
    accent: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-500/20",
    stat: "Top 5% dos editais",
  },
  {
    icon: FileCheck,
    title: "Checklist de habilitação",
    description: "A IA lê o edital e gera um checklist com exatamente os documentos que você precisa apresentar — sem surpresas na sessão.",
    accent: "from-violet-500 to-violet-700",
    shadow: "shadow-violet-500/20",
    stat: "< 30s por edital",
  },
  {
    icon: BellRing,
    title: "Alertas de vencimento",
    description: "Cadastre seus documentos de habilitação e receba alertas automáticos antes do vencimento. Nunca mais perca uma licitação por CND vencida.",
    accent: "from-emerald-500 to-emerald-700",
    shadow: "shadow-emerald-500/20",
    stat: "3x/dia verificado",
  },
  {
    icon: BarChart3,
    title: "Relatórios em tempo real",
    description: "Dashboard com métricas de monitoramento, histórico de participações e status dos documentos — tudo em um lugar só.",
    accent: "from-orange-500 to-orange-700",
    shadow: "shadow-orange-500/20",
    stat: "100% online",
  },
  {
    icon: Clock,
    title: "Monitoramento 24/7",
    description: "O PNCP publica novos editais a qualquer hora. O LicitaAI monitora continuamente e te avisa no mesmo dia em que aparecer uma oportunidade.",
    accent: "from-rose-500 to-rose-700",
    shadow: "shadow-rose-500/20",
    stat: "24h/dia ativo",
  },
  {
    icon: Shield,
    title: "Dados 100% seguros",
    description: "Seus dados ficam criptografados e isolados. Nenhuma outra empresa vê o seu perfil, documentos ou estratégia de licitação.",
    accent: "from-cyan-500 to-cyan-700",
    shadow: "shadow-cyan-500/20",
    stat: "Criptografia total",
  },
]

export function LandingBeneficios() {
  return (
    <section id="beneficios" className="py-24 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Seção Problema */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-blue-500/30 text-blue-300 text-sm font-medium mb-6"
          >
            O problema real
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Sua empresa está{" "}
            <span className="text-red-400">perdendo contratos</span>{" "}
            <br className="hidden md:block" />
            todos os dias
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
          {problemas.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl border border-white/5 text-center"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-4xl font-black text-white mb-3">{item.numero}</div>
              <p className="text-slate-400 text-sm leading-relaxed">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Separador */}
        <div className="max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24" />

        {/* Features */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-blue-500/30 text-blue-300 text-sm font-medium mb-6"
          >
            Por que o LicitaAI?
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Tudo que você precisa para{" "}
            <br className="hidden md:block" />
            <span className="text-blue-400">vencer mais licitações</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-300"
          >
            Automatizamos as etapas mais trabalhosas para que sua equipe foque no que importa: elaborar a melhor proposta.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="glass-card p-8 rounded-2xl group hover:-translate-y-1 hover:border-white/10 transition-all duration-300 flex flex-col gap-5"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accent} shadow-lg ${feature.shadow} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">
                  {feature.stat}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
