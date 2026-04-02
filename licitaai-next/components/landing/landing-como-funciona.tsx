"use client"

import { Search, Brain, Target, Trophy } from "lucide-react"
import { motion } from "motion/react"

const steps = [
  {
    icon: Search,
    title: "1. Mapeamento Automático",
    description: "Nossa IA se conecta ao ComprasNet e a diversos diários oficiais, buscando 24h por dia novos editais.",
    color: "from-blue-600 to-blue-400"
  },
  {
    icon: Brain,
    title: "2. Leitura e Compreensão",
    description: "A inteligência artificial lê todo o edital (incluindo anexos), extraindo o objeto, valor estimado, exigências e datas.",
    color: "from-cyan-500 to-cyan-300"
  },
  {
    icon: Target,
    title: "3. Classificação (Match)",
    description: "A IA compara as exigências do edital com o perfil e CNAEs da sua empresa, gerando um Score de Relevância de 0 a 100%.",
    color: "from-emerald-500 to-emerald-300"
  },
  {
    icon: Trophy,
    title: "4. Tomada de Decisão",
    description: "Você recebe apenas as melhores oportunidades diretamente no painel ou por e-mail, prontas para análise da sua equipe.",
    color: "from-blue-500 to-cyan-400"
  },
]

export function LandingComoFunciona() {
  return (
    <section id="solucao" className="py-24 bg-[#050D1A] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-blue-500/30 text-blue-300 text-sm font-medium mb-6"
          >
            A Solução
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Como a IA funciona <br className="hidden md:block"/>
            <span className="text-blue-400">na prática</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Substituímos o trabalho manual e repetitivo por algoritmos de linguagem natural 
            que processam milhares de páginas por minuto.
          </motion.p>
        </div>

        {/* Vertical Timeline container */}
        <div className="relative max-w-4xl mx-auto">
          
          {/* Connecting line (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600/50 via-cyan-400/50 to-transparent -translate-x-1/2" />
          
          {/* Connecting line (Mobile) */}
          <div className="md:hidden absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600/50 via-cyan-400/50 to-transparent" />

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`relative flex items-center flex-col md:flex-row gap-8 md:gap-16 ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  
                  {/* Timeline icon (Center on desktop, left on mobile) */}
                  <div className="absolute left-8 md:left-1/2 -ml-6 md:-ml-8 top-0 md:top-1/2 md:-translate-y-1/2 z-10 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg shadow-blue-500/20 border border-white/10"
                       style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl opacity-20`} />
                    <step.icon className={`h-6 w-6 md:h-8 md:w-8 text-white relative z-10`} />
                  </div>

                  {/* Empty space for desktop alignment */}
                  <div className="hidden md:block w-1/2" />

                  {/* Content Card */}
                  <div className={`w-full md:w-1/2 pl-24 md:pl-0 ${isEven ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left"}`}>
                    <div className="glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all duration-300">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{step.title}</h3>
                      <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                        {step.description}
                      </p>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
