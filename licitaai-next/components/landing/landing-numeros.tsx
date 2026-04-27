interface LandingNumerosProps {
  totalLicitacoes: number
  totalUfs: number
}

const portais = [
  { nome: "Effecti", descricao: "Portal de licitações" },
  { nome: "PNCP", descricao: "Portal Nacional de Contratações Públicas" },
]

export function LandingNumeros({ totalLicitacoes, totalUfs }: LandingNumerosProps) {
  const formattedLicit = totalLicitacoes > 0
    ? totalLicitacoes.toLocaleString("pt-BR")
    : "—"

  const stats = [
    {
      value: formattedLicit,
      label: "Licitações monitoradas",
      sublabel: "coletadas automaticamente",
    },
    {
      value: totalUfs > 0 ? `${totalUfs}` : "26+",
      label: "UFs cobertas",
      sublabel: "cobertura nacional",
    },
    {
      value: `${portais.length}`,
      label: "Portais integrados",
      sublabel: portais.map((p) => p.nome).join(" + "),
    },
  ]

  return (
    <section className="py-24 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12">
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Plataforma usada por empresas que faturam com o governo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]"
            >
              <div className="text-4xl md:text-5xl font-black text-white mb-2 tabular-nums">
                {stat.value}
              </div>
              <div className="text-base font-semibold text-slate-200 mb-1">{stat.label}</div>
              <div className="text-sm text-slate-500">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
