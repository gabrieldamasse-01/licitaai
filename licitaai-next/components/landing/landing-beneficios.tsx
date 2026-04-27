const features = [
  {
    emoji: "🔍",
    title: "Monitoramento automático",
    description:
      "Integração nativa com Effecti e PNCP. Novas licitações são capturadas 3× ao dia e filtradas automaticamente pelo perfil CNAE da sua empresa.",
  },
  {
    emoji: "🤖",
    title: "Análise de edital com IA",
    description:
      "A IA lê o edital completo, extrai objeto, valor estimado, exigências técnicas e datas críticas em segundos — o que levaria horas de leitura manual.",
  },
  {
    emoji: "📄",
    title: "Geração de proposta com IA",
    description:
      "Com base no edital analisado, o LicitaAI gera uma proposta comercial estruturada, pronta para revisão e envio — sem começar do zero.",
  },
  {
    emoji: "📋",
    title: "Checklist de habilitação",
    description:
      "Lista automática dos documentos exigidos para cada licitação. Saiba exatamente o que precisa preparar antes de decidir participar.",
  },
  {
    emoji: "🔔",
    title: "Alertas de oportunidades",
    description:
      "Receba por email as licitações mais relevantes ranqueadas por score. Também alertamos sobre documentos de habilitação próximos do vencimento.",
  },
  {
    emoji: "📊",
    title: "Score de compatibilidade",
    description:
      "Cada licitação recebe uma pontuação de 0 a 100% com base nos CNAEs, porte e região da empresa. Foque onde tem mais chance de vencer.",
  },
]

export function LandingBeneficios() {
  return (
    <section id="features" className="py-24 bg-[#050D1A] relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-6">
            Solução completa
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Tudo que você precisa para{" "}
            <br className="hidden md:block" />
            <span className="text-blue-400">vencer mais licitações</span>
          </h2>
          <p className="text-lg text-slate-300">
            Automatizamos as etapas mais trabalhosas para que sua equipe
            foque no que realmente importa: elaborar a melhor proposta.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300"
            >
              <div className="text-4xl mb-5">{feature.emoji}</div>
              <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
