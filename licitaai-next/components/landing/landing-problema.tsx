import { Clock, AlertTriangle, FolderX } from "lucide-react"

const problemas = [
  {
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    title: "Você perde licitações por falta de monitoramento",
    description:
      "Editais são publicados diariamente no PNCP e portais estaduais. Sem monitoramento automatizado, oportunidades passam despercebidas enquanto concorrentes participam.",
  },
  {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "Análise manual de editais consome horas",
    description:
      "Ler um edital completo para verificar compatibilidade com sua empresa leva horas. Multiplicado por dezenas de licitações por semana, o tempo gasto é inviável.",
  },
  {
    icon: FolderX,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    title: "Documentação desorganizada causa desclassificação",
    description:
      "CND vencida, FGTS expirado, Contrato Social desatualizado — um documento ausente ou fora do prazo é suficiente para ser desclassificado mesmo com a melhor proposta.",
  },
]

export function LandingProblema() {
  return (
    <section id="problema" className="py-24 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-medium mb-6">
            O problema
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Por que empresas{" "}
            <span className="text-red-400">perdem contratos</span>
          </h2>
          <p className="text-lg text-slate-300">
            Sem as ferramentas certas, participar de licitações é lento, caro e incerto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problemas.map((p, i) => {
            const Icon = p.icon
            return (
              <div
                key={i}
                className={`p-8 rounded-2xl border ${p.bg} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${p.bg}`}>
                  <Icon className={`h-6 w-6 ${p.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{p.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
