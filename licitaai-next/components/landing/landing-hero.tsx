import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0D3B5E] via-[#1A5276] to-[#2E86C1] min-h-[90vh] flex items-center">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-white/20">
            <Zap className="w-4 h-4 text-yellow-300" />
            Inteligência Artificial para Licitações
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Vença mais
            <span className="block text-[#5DADE2]">licitações públicas</span>
            com IA
          </h1>

          <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-xl">
            A LicitaIA monitora, analisa e classifica oportunidades de
            licitações governamentais em tempo real — para que sua empresa foque
            no que importa:{" "}
            <strong className="text-white">vencer contratos</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1A5276] font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-lg"
            >
              Começar gratuitamente
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all text-lg"
            >
              Entrar na plataforma
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">+15k</p>
              <p className="text-sm text-white/60 mt-1">Licitações/mês</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-sm text-white/60 mt-1">Precisão da IA</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">+2.400</p>
              <p className="text-sm text-white/60 mt-1">Empresas ativas</p>
            </div>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-[#1A5276] px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-white/60 text-xs">
                app.licitaia.com.br
              </span>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="flex gap-3">
                <div className="w-36 bg-[#1A5276] rounded-xl p-3 flex flex-col gap-3">
                  <div className="text-white text-xs font-semibold opacity-80">
                    LicitaIA
                  </div>
                  {["Dashboard", "Licitações", "Documentos", "Propostas"].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`text-xs px-2 py-1.5 rounded-lg ${i === 1 ? "bg-white/20 text-white" : "text-white/60"}`}
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Oportunidades de hoje
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-green-600">47</p>
                        <p className="text-xs text-gray-500">Novas</p>
                      </div>
                      <div className="flex-1 bg-yellow-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-yellow-600">12</p>
                        <p className="text-xs text-gray-500">Urgentes</p>
                      </div>
                    </div>
                  </div>
                  {[
                    {
                      title: "Serviços de TI — SP",
                      value: "R$ 380k",
                      match: "97%",
                      color: "green",
                    },
                    {
                      title: "Manutenção Predial — RJ",
                      value: "R$ 120k",
                      match: "89%",
                      color: "blue",
                    },
                    {
                      title: "Consultoria — MG",
                      value: "R$ 55k",
                      match: "74%",
                      color: "yellow",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">{item.value}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          item.color === "green"
                            ? "bg-green-100 text-green-700"
                            : item.color === "blue"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.match}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
