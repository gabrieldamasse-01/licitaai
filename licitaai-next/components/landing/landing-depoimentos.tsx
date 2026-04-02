import { Star } from "lucide-react"

const depoimentos = [
  {
    nome: "Rodrigo Almeida",
    cargo: "Diretor Comercial",
    empresa: "TechServ Soluções",
    texto:
      "A LicitaIA transformou nossa operação de licitações. Em 6 meses aumentamos nossa taxa de participação em 340% e fechamos 8 contratos que nunca teríamos descoberto manualmente.",
    estrelas: 5,
    avatar: "RA",
    cor: "#1A5276",
  },
  {
    nome: "Fernanda Costa",
    cargo: "Gerente de Contratos",
    empresa: "Construmax Engenharia",
    texto:
      "O sistema de alertas é incrível. Antes perdíamos prazos por falta de monitoramento. Agora recebo notificações instantâneas de licitações compatíveis com nossa área.",
    estrelas: 5,
    avatar: "FC",
    cor: "#27AE60",
  },
  {
    nome: "Paulo Mendonça",
    cargo: "Sócio-Fundador",
    empresa: "Alpha Facilities",
    texto:
      "A análise de editais com IA economiza horas de trabalho da nossa equipe. O sistema identifica riscos e oportunidades que levaríamos dias para mapear.",
    estrelas: 5,
    avatar: "PM",
    cor: "#2E86C1",
  },
]

export function LandingDepoimentos() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#2E86C1] uppercase tracking-widest">
            Resultados reais
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
            O que dizem nossos clientes
          </h2>
          <p className="text-xl text-gray-500">
            Mais de 2.400 empresas já transformaram seus resultados em
            licitações
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {depoimentos.map((d) => (
            <div
              key={d.nome}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: d.estrelas }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6 italic">
                &ldquo;{d.texto}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: d.cor }}
                >
                  {d.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{d.nome}</p>
                  <p className="text-sm text-gray-500">
                    {d.cargo} · {d.empresa}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
