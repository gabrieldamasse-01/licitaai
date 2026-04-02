const steps = [
  {
    number: "01",
    title: "Cadastre sua empresa",
    description:
      "Informe CNPJ, ramo de atuação, CNAEs, estados de interesse e faixas de valor. Em minutos, sua empresa está configurada.",
    detail: "Processo 100% online, sem burocracia",
  },
  {
    number: "02",
    title: "IA mapeia oportunidades",
    description:
      "Nossa inteligência artificial monitora portais públicos 24h por dia e filtra apenas as licitações compatíveis com o perfil da sua empresa.",
    detail: "Alertas em tempo real por e-mail e notificação",
  },
  {
    number: "03",
    title: "Participe e vença",
    description:
      "Acesse análises detalhadas dos editais, organize documentos e prepare propostas competitivas com o suporte da nossa plataforma.",
    detail: "Taxa de conversão 3x maior que a média do mercado",
  },
]

export function LandingComoFunciona() {
  return (
    <section className="py-24 bg-gray-50" id="como-funciona">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#2E86C1] uppercase tracking-widest">
            Processo simplificado
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
            Como funciona a LicitaIA
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Em três passos simples, sua empresa começa a participar de
            licitações com muito mais inteligência e eficiência.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-[#2E86C1] to-[#27AE60]" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1A5276] text-white text-xl font-bold mb-6 shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  {step.description}
                </p>
                <span className="inline-block text-sm font-medium text-[#27AE60] bg-green-50 px-4 py-1.5 rounded-full">
                  ✓ {step.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
