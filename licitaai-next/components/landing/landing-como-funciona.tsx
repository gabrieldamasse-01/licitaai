import { Building2, Brain, FileText } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Cadastre sua empresa e CNAEs",
    description:
      "Informe CNPJ, CNAEs e regiões de interesse. O LicitaAI usa esse perfil para filtrar apenas as licitações realmente relevantes para o seu negócio.",
    color: "from-blue-600 to-blue-400",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    number: "02",
    icon: Brain,
    title: "Receba oportunidades com score de compatibilidade",
    description:
      "A IA analisa cada edital e gera um score de 0 a 100% com base no perfil da empresa. Você vê primeiro onde tem mais chance de vencer.",
    color: "from-cyan-500 to-cyan-300",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    number: "03",
    icon: FileText,
    title: "Gere propostas com IA e participe",
    description:
      "Com um clique, o LicitaAI gera uma proposta estruturada baseada no edital. Revise, ajuste e envie — sem começar do zero toda vez.",
    color: "from-emerald-500 to-emerald-300",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
]

export function LandingComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 bg-[#050D1A] relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-6">
            Como funciona
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Do cadastro ao contrato em{" "}
            <span className="text-blue-400">3 passos</span>
          </h2>
          <p className="text-lg text-slate-300">
            Configure uma vez e deixe a IA trabalhar por você — monitorando
            Effecti e PNCP 24 horas por dia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="relative p-8 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-blue-500/20 transition-all duration-300 flex flex-col"
              >
                <span className="text-5xl font-black text-white/5 absolute top-6 right-6 leading-none select-none">
                  {step.number}
                </span>

                <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center mb-6 shrink-0`}>
                  <Icon className={`w-7 h-7 ${step.iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm flex-1">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-500 text-xs font-bold">
                    →
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
