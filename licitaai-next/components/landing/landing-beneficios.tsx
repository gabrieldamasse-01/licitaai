import { Search, Brain, FileCheck } from "lucide-react"

const beneficios = [
  {
    icon: Search,
    title: "Monitoramento Automático",
    description:
      "Acompanhamos mais de 15 mil licitações por mês em todos os portais públicos — COMPRASNET, BEC, Licitações-e e muito mais. Nunca perca uma oportunidade.",
    color: "blue",
  },
  {
    icon: Brain,
    title: "Análise com Inteligência Artificial",
    description:
      "Nossa IA analisa editais, identifica riscos, calcula compatibilidade com o perfil da sua empresa e gera um ranking de oportunidades personalizado.",
    color: "indigo",
  },
  {
    icon: FileCheck,
    title: "Gestão de Documentos e Propostas",
    description:
      "Organize habilitações, certidões e documentos técnicos em um só lugar. Receba alertas de vencimento e monte propostas com agilidade.",
    color: "teal",
  },
]

export function LandingBeneficios() {
  return (
    <section className="py-24 bg-white" id="beneficios">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#2E86C1] uppercase tracking-widest">
            Por que LicitaIA?
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
            Tudo que sua empresa precisa para{" "}
            <span className="text-[#1A5276]">vencer licitações</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Da descoberta à proposta vencedora — a LicitaIA cuida de cada etapa
            do processo licitatório com tecnologia de ponta.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {beneficios.map((b) => {
            const Icon = b.icon
            const colors = {
              blue: "bg-blue-50 text-[#2E86C1]",
              indigo: "bg-indigo-50 text-indigo-600",
              teal: "bg-teal-50 text-teal-600",
            }
            return (
              <div
                key={b.title}
                className="group bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors[b.color as keyof typeof colors]}`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {b.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{b.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
