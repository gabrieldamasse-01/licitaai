"use client"

import { Building2, Brain, Bell } from "lucide-react"
import { motion } from "motion/react"

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Cadastre sua empresa e CNAEs",
    description:
      "Informe o CNPJ, os CNAEs da sua empresa e as regiões de interesse. O LicitaAI usa esse perfil para filtrar apenas as licitações realmente relevantes para você.",
    color: "from-blue-600 to-blue-400",
  },
  {
    number: "02",
    icon: Brain,
    title: "Nossa IA analisa e pontua cada licitação",
    description:
      "A inteligência artificial lê cada edital do PNCP, extrai objeto, valor, exigências e datas, e gera um score de relevância de 0 a 100% com base no perfil da sua empresa.",
    color: "from-cyan-500 to-cyan-300",
  },
  {
    number: "03",
    icon: Bell,
    title: "Receba oportunidades relevantes no seu email",
    description:
      "Você recebe alertas diários com as melhores oportunidades ranqueadas. Também notificamos sobre documentos de habilitação próximos do vencimento.",
    color: "from-emerald-500 to-emerald-300",
  },
]

export function LandingComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 bg-[#050D1A] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-blue-500/30 text-blue-300 text-sm font-medium mb-6"
          >
            Como funciona
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Do cadastro ao alerta em{" "}
            <span className="text-blue-400">3 passos</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Configure uma vez e deixe a IA trabalhar por você — monitorando o PNCP
            24 horas por dia.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all duration-300 flex flex-col"
            >
              {/* Step number */}
              <span className="text-5xl font-black text-white/5 absolute top-6 right-6 leading-none select-none">
                {step.number}
              </span>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-10 flex items-center justify-center mb-6 shrink-0`}>
                <div className={`absolute w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} opacity-10`} />
                <step.icon className="w-7 h-7 text-white relative z-10" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm flex-1">
                {step.description}
              </p>

              {/* Connector arrow (not on last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
