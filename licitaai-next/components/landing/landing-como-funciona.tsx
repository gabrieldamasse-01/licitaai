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
    accent: "from-blue-500 to-blue-700",
    glow: "shadow-blue-500/30",
  },
  {
    number: "02",
    icon: Brain,
    title: "Nossa IA analisa e pontua cada licitação",
    description:
      "A inteligência artificial lê cada edital do PNCP, extrai objeto, valor, exigências e datas, e gera um score de relevância de 0 a 100% com base no perfil da sua empresa.",
    accent: "from-violet-500 to-violet-700",
    glow: "shadow-violet-500/30",
  },
  {
    number: "03",
    icon: Bell,
    title: "Receba oportunidades relevantes no seu email",
    description:
      "Você recebe alertas diários com as melhores oportunidades ranqueadas. Também notificamos sobre documentos de habilitação próximos do vencimento.",
    accent: "from-emerald-500 to-emerald-700",
    glow: "shadow-emerald-500/30",
  },
]

const numeros = [
  { valor: "13.411", label: "licitações monitoradas" },
  { valor: "98%", label: "de precisão no score" },
  { valor: "27", label: "estados cobertos" },
]

export function LandingComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 bg-[#050D1A] relative overflow-hidden">
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
            className="text-lg text-slate-300"
          >
            Configure uma vez e deixe a IA trabalhar por você — monitorando o PNCP 24 horas por dia.
          </motion.p>
        </div>

        {/* Steps com linha conectora horizontal */}
        <div className="relative max-w-6xl mx-auto">
          {/* Linha conectora */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-emerald-500/40" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all duration-300 flex flex-col"
              >
                {/* Step number ghost */}
                <span className="text-5xl font-black text-white/5 absolute top-6 right-6 leading-none select-none">
                  {step.number}
                </span>

                {/* Numbered icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.accent} shadow-lg ${step.glow} flex items-center justify-center mb-6 shrink-0 relative`}>
                  <step.icon className="w-8 h-8 text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border border-white/10 text-xs font-black text-white flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-300 leading-relaxed text-base flex-1">{step.description}</p>

                {/* Seta conectora */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-5 top-12 z-20 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400 text-sm font-bold shadow-lg">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Números de impacto */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          {numeros.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-black text-white mb-2">{item.valor}</div>
              <div className="text-sm text-slate-400">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
