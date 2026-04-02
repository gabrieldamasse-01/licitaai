"use client"

import { Search, Filter, Bell, Clock, FileText, Zap } from "lucide-react"
import { motion } from "motion/react"

const benefits = [
  {
    icon: Search,
    title: "Busca Inteligente",
    description: "Nossa IA varre mais de 15.000 editais mensais no ComprasNet para encontrar as melhores oportunidades para você.",
  },
  {
    icon: Filter,
    title: "Filtros Avançados",
    description: "Crie filtros complexos por palavras-chave exclusivas, localidade e UASG para não perder nenhuma oportunidade.",
  },
  {
    icon: Bell,
    title: "Alertas em Tempo Real",
    description: "Receba notificações imediatamente quando novos editais com seu perfil forem publicados.",
  },
  {
    icon: Clock,
    title: "Economia de Tempo",
    description: "O que levava horas lendo diários oficiais, agora leva segundos com nossa triagem automatizada.",
  },
  {
    icon: FileText,
    title: "Análise de Editais",
    description: "A IA resume os pontos mais importantes do edital e destaca possíveis riscos e exigências.",
  },
  {
    icon: Zap,
    title: "Score de Relevância",
    description: "Nossa IA classifica cada licitação de 0 a 100% de match com o perfil da sua empresa.",
  },
]

export function LandingBeneficios() {
  return (
    <section id="beneficios" className="py-24 bg-[#0A1628] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Tudo que você precisa para <br className="hidden md:block"/>
            <span className="text-blue-400">multiplicar suas vendas</span> públicas
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            Nossa plataforma consolida todas as ferramentas necessárias para você
            focar no que importa: preparar a melhor proposta e vencer.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl group hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-600/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600/20 transition-all duration-300">
                <benefit.icon className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
