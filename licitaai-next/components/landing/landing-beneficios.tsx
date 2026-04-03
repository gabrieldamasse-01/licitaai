"use client"

import { Target, FileCheck, BellRing, BarChart3 } from "lucide-react"
import { motion } from "motion/react"

const features = [
  {
    emoji: "🎯",
    icon: Target,
    title: "Score de relevância por CNAE",
    description:
      "Cada licitação recebe uma pontuação de 0 a 100% calculada com base nos CNAEs, porte e região da sua empresa. Você vê primeiro o que tem mais chance de ganhar.",
  },
  {
    emoji: "📄",
    icon: FileCheck,
    title: "Checklist de habilitação automático",
    description:
      "A IA lê os requisitos do edital e gera um checklist personalizado com os documentos que sua empresa precisa apresentar para participar da licitação.",
  },
  {
    emoji: "🔔",
    icon: BellRing,
    title: "Alertas de vencimento de documentos",
    description:
      "Cadastre seus documentos de habilitação (CND, FGTS, CNDT, etc.) e receba alertas automáticos por email quando estiverem próximos do vencimento.",
  },
  {
    emoji: "📊",
    icon: BarChart3,
    title: "Relatórios e métricas em tempo real",
    description:
      "Acompanhe quantas licitações foram monitoradas, quais tiveram maior score, histórico de participações e o status dos seus documentos em um dashboard completo.",
  },
]

export function LandingBeneficios() {
  return (
    <section id="beneficios" className="py-24 bg-[#0A1628] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
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
            Automatizamos as etapas mais trabalhosas para que sua equipe
            foque no que realmente importa: elaborar a melhor proposta.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl group hover:border-blue-500/30 transition-all duration-300 flex gap-6"
            >
              <div className="text-4xl shrink-0 mt-1">{feature.emoji}</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
