"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    pergunta: "O que é uma licitação?",
    resposta:
      "Licitação é o processo pelo qual órgãos públicos (prefeituras, estados, governo federal, estatais) contratam empresas para fornecer produtos ou serviços. É obrigatório pela Lei 14.133/2021 e garante igualdade de oportunidades entre os participantes. Toda empresa pode participar, desde que esteja com documentação regular.",
  },
  {
    pergunta: "Como o LicitaAI encontra oportunidades para minha empresa?",
    resposta:
      "O LicitaAI monitora o PNCP (Portal Nacional de Contratações Públicas) e outros portais 24 horas por dia, coletando editais em tempo real. Quando surge um novo edital, o sistema analisa automaticamente o objeto licitado e compara com o CNAE e o perfil da sua empresa, gerando um score de relevância. Você só recebe alertas das oportunidades com maior probabilidade de sucesso.",
  },
  {
    pergunta: "Preciso ter experiência em licitações para usar?",
    resposta:
      "Não. O LicitaAI foi desenvolvido para empresas de todos os níveis — desde quem nunca participou de uma licitação até escritórios especializados. A plataforma entrega as oportunidades filtradas, analisa o edital com IA e ajuda a criar a proposta comercial. Você foca em vender; a tecnologia cuida do monitoramento.",
  },
  {
    pergunta: "Quantas licitações são monitoradas?",
    resposta:
      "O LicitaAI monitora dezenas de milhares de editais publicados nos portais integrados. A base é atualizada automaticamente três vezes ao dia (6h, 12h e 18h, horário de Brasília) e cobre licitações de todos os estados brasileiros. Você também pode sincronizar manualmente a qualquer momento.",
  },
  {
    pergunta: "Posso cancelar quando quiser?",
    resposta:
      "Sim. Não há fidelidade ou multa por cancelamento. Você pode cancelar sua assinatura a qualquer momento diretamente nas configurações da conta. Seu acesso continua ativo até o final do período pago.",
  },
]

export function LandingFaq() {
  const [aberto, setAberto] = useState<number | null>(null)

  function toggle(i: number) {
    setAberto((prev) => (prev === i ? null : i))
  }

  return (
    <section id="faq" className="py-24 bg-[#050D1A] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-6">
            Perguntas Frequentes
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Tudo que você precisa saber
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = aberto === i
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-white">{faq.pergunta}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? "400px" : "0",
                    transition: "max-height 0.25s ease",
                    overflow: "hidden",
                  }}
                >
                  <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">
                    {faq.resposta}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
