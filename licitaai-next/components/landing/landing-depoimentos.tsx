import { Star } from "lucide-react"

const testimonials = [
  {
    author: "Carlos Silveira",
    role: "Diretor Comercial",
    company: "TechGov Soluções",
    content:
      "Antes do LicitaAI nossa equipe perdia 4 horas diárias lendo diários oficiais. Hoje recebemos as oportunidades filtradas logo cedo, com alta precisão. Aumentamos nossas vitórias em 45%.",
    rating: 5,
  },
  {
    author: "Mariana Costa",
    role: "Gerente de Licitações",
    company: "Construtora Horizonte",
    content:
      "O Score de Relevância é um divisor de águas. Não só encontra o edital, como rankeia as licitações onde temos mais chances de vencer. O painel é super intuitivo.",
    rating: 5,
  },
  {
    author: "Roberto Almeida",
    role: "Sócio Administrador",
    company: "Almeida & Cia Fornecimento",
    content:
      "Como pequena empresa, não tínhamos braço para monitorar o Brasil inteiro. O LicitaAI democratizou nosso acesso — fechamos nosso primeiro grande pregão federal graças ao alerta instantâneo.",
    rating: 5,
  },
]

export function LandingDepoimentos() {
  return (
    <section id="depoimentos" className="py-24 bg-[#0A1628] relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-700/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-6">
            Casos de Sucesso
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Quem usa, aprova e{" "}
            <span className="text-blue-400">vence</span>
          </h2>
        </div>

        <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col justify-between p-8 rounded-3xl min-w-[300px] sm:min-w-[350px] md:min-w-0 snap-center border border-white/5 bg-white/[0.03] hover:border-blue-500/30 transition-all"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  &quot;{testimonial.content}&quot;
                </p>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">{testimonial.author}</h4>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {testimonial.role} •{" "}
                    <span className="text-blue-400">{testimonial.company}</span>
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
