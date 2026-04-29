"use client"

import Link from "next/link"
import { useState, useMemo, useRef, useCallback } from "react"
import {
  TrendingDown,
  DollarSign,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Empresa = {
  id: string
  razao_social: string
  cnpj: string | null
  cnae: string[] | null
}

type Licitacao = {
  id: string
  objeto: string | null
  orgao: string | null
  uf: string | null
  modalidade: string | null
  valor_estimado: number | null
  data_encerramento: string | null
  status: string | null
}

type LicitacaoComScore = Licitacao & {
  score: number
  scoreLabel: string
}

function formatCurrency(valor: number | null): string {
  if (!valor) return "Nao informado"
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

function formatDate(data: string | null): string {
  if (!data) return "—"
  const d = new Date(data.includes("T") ? data : data + "T12:00:00")
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR")
}

const PAGE_SIZE = 50

// Mapa de palavras-chave por divisão CNAE (2 primeiros dígitos)
const CNAE_KEYWORDS: Record<string, string[]> = {
  "01": ["agricultura", "agropecuária", "cultivo", "pecuária", "agrícola"],
  "02": ["silvicultura", "florestal", "madeira", "reflorestamento"],
  "03": ["pesca", "aquicultura", "pescado"],
  "05": ["carvão", "mineral", "mineração"],
  "06": ["petróleo", "gás", "combustível"],
  "10": ["alimentos", "alimentício", "beneficiamento", "processamento de alimentos"],
  "11": ["bebidas", "água mineral", "refrigerante"],
  "13": ["têxtil", "fio", "tecido", "fibra"],
  "14": ["vestuário", "confecção", "uniforme", "roupa", "indumentária"],
  "15": ["couro", "calçado", "sapato"],
  "16": ["madeira", "móveis", "marcenaria", "carpintaria"],
  "17": ["papel", "celulose", "embalagem"],
  "18": ["impressão", "gráfica", "publicação", "editoração"],
  "19": ["petroquímica", "refinaria", "combustível"],
  "20": ["química", "produto químico", "saneante", "defensivo"],
  "21": ["farmacêutico", "medicamento", "remédio", "insumo farmacêutico"],
  "22": ["borracha", "plástico", "embalagem plástica"],
  "23": ["minerais não-metálicos", "cerâmica", "vidro", "cimento", "concreto"],
  "24": ["metalurgia", "siderurgia", "aço", "ferro"],
  "25": ["metal", "estrutura metálica", "serralheria"],
  "26": ["eletrônico", "equipamento eletrônico", "computador", "informática", "hardware"],
  "27": ["elétrico", "equipamento elétrico", "motor elétrico", "transformador"],
  "28": ["máquina", "equipamento", "maquinário"],
  "29": ["veículo", "automóvel", "caminhão", "ônibus"],
  "30": ["embarcação", "aeronave", "ferroviário"],
  "31": ["móveis", "mobiliário"],
  "32": ["instrumentos", "óptico", "relógio"],
  "33": ["manutenção", "reparo", "instalação de máquinas"],
  "35": ["energia elétrica", "eletricidade", "geração de energia", "subestação"],
  "36": ["água", "saneamento", "abastecimento de água", "esgoto"],
  "37": ["esgoto", "resíduos", "coleta de esgoto"],
  "38": ["resíduos", "lixo", "coleta de resíduos", "reciclagem"],
  "39": ["remediação", "descontaminação"],
  "41": ["construção civil", "edificação", "obras", "reforma", "construção de edifícios"],
  "42": ["infraestrutura", "rodovia", "ferrovia", "porto", "aeroporto", "obra de infraestrutura"],
  "43": ["instalação", "acabamento", "pintura", "elétrica predial", "hidráulica"],
  "45": ["comércio de veículos", "peças automotivas", "concessionária"],
  "46": ["comércio atacadista", "distribuição", "atacado"],
  "47": ["comércio varejista", "varejo", "loja"],
  "49": ["transporte terrestre", "frete", "logística", "caminhoneiro"],
  "50": ["transporte aquaviário", "navegação"],
  "51": ["transporte aéreo", "aviação", "carga aérea"],
  "52": ["armazenagem", "armazém", "depósito", "logística"],
  "53": ["correio", "entrega", "malote"],
  "55": ["hospedagem", "hotel", "pousada"],
  "56": ["alimentação", "restaurante", "refeição", "catering", "lanche"],
  "58": ["edição", "software", "publicação de software"],
  "61": ["telecomunicações", "telefonia", "internet", "banda larga", "comunicação"],
  "62": ["tecnologia da informação", "software", "sistemas", "desenvolvimento de software", "ti", "tic", "programa de computador"],
  "63": ["dados", "hospedagem de dados", "portal", "processamento de dados"],
  "64": ["financeiro", "banco", "crédito", "seguro"],
  "65": ["seguro", "previdência", "resseguro"],
  "66": ["corretora", "financeiro", "bolsa"],
  "68": ["imóveis", "aluguel", "locação", "imobiliária"],
  "69": ["jurídico", "advocacia", "contabilidade", "auditoria"],
  "70": ["consultoria", "gestão", "assessoria"],
  "71": ["engenharia", "arquitetura", "projeto", "topografia", "geotecnia"],
  "72": ["pesquisa", "desenvolvimento", "p&d", "ciência"],
  "73": ["publicidade", "propaganda", "marketing", "comunicação"],
  "74": ["design", "fotografia", "tradução"],
  "75": ["veterinária", "animal", "zootecnia"],
  "77": ["locação de equipamentos", "aluguel de máquinas", "leasing"],
  "78": ["recursos humanos", "seleção", "mão de obra", "terceirização de pessoal"],
  "79": ["viagem", "turismo", "agência de viagens"],
  "80": ["segurança", "vigilância", "monitoramento"],
  "81": ["limpeza", "conservação", "portaria", "zeladoria", "copa"],
  "82": ["call center", "suporte", "secretaria"],
  "84": ["administração pública", "defesa", "seguridade"],
  "85": ["educação", "ensino", "treinamento", "capacitação", "escola", "curso"],
  "86": ["saúde", "hospital", "clínica", "médico", "ambulatorial"],
  "87": ["assistência social", "acolhimento", "abrigo"],
  "88": ["assistência social", "creche", "apoio social"],
  "90": ["arte", "cultura", "espetáculo", "entretenimento"],
  "91": ["biblioteca", "museu", "arquivo"],
  "92": ["loteria", "apostas"],
  "93": ["esporte", "recreação", "academia"],
  "94": ["associação", "sindicato", "organização"],
  "95": ["reparo de computadores", "manutenção de eletrônicos"],
  "96": ["lavanderia", "cabeleireiro", "estética", "serviços pessoais"],
}

function getKeywordsFromCnaes(cnaes: string[]): string[] {
  const keywords = new Set<string>()
  for (const cnae of cnaes) {
    const divisao = cnae.replace(/\D/g, "").slice(0, 2)
    const words = CNAE_KEYWORDS[divisao] ?? []
    words.forEach((w) => keywords.add(w))
    // também tenta os 4 primeiros dígitos como código direto
    const codigo4 = cnae.replace(/\D/g, "").slice(0, 4)
    keywords.add(codigo4)
  }
  return Array.from(keywords)
}

export function calcularCompatibilidadePerdidas(
  objeto: string,
  cnaes: string[],
): { score: number; label: "Alta" | "Média" | "Baixa" } {
  const obj = objeto.toLowerCase()
  const keywords = getKeywordsFromCnaes(cnaes)

  // Alta: objeto contém código CNAE exato (4 dígitos) ou palavra-chave do setor
  const altaMatch = keywords.some((kw) => {
    if (/^\d{4}$/.test(kw)) return obj.includes(kw)
    return obj.includes(kw.toLowerCase())
  })
  if (altaMatch) return { score: 90, label: "Alta" }

  // Média: objeto contém pelo menos 1 palavra de setores relacionados genéricos
  const termosGenericos = ["serviço", "fornecimento", "aquisição", "contratação", "prestação"]
  const mediaMatch = termosGenericos.some((t) => obj.includes(t))
  if (mediaMatch) return { score: 55, label: "Média" }

  return { score: 30, label: "Baixa" }
}

function calcScore(objeto: string | null, cnaes: string[] | null): { score: number; label: string } {
  if (!objeto || !cnaes || cnaes.length === 0) return { score: 30, label: "Baixa" }
  const { score, label } = calcularCompatibilidadePerdidas(objeto, cnaes)
  return { score, label }
}

function getScoreClass(label: string): string {
  if (label === "Alta") return "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
  if (label === "Média") return "bg-amber-950/60 text-amber-400 border-amber-800/50"
  return "bg-slate-800/60 text-slate-400 border-slate-700"
}

function calcPeriodStart(period: string): string {
  const now = new Date()
  const days = parseInt(period)
  now.setDate(now.getDate() - days)
  return now.toISOString().split("T")[0]
}

function ImpactCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export function LicitacoesPerdidasClient({
  empresas,
  licitacoes,
}: {
  empresas: Empresa[]
  licitacoes: Licitacao[]
}) {
  const [empresaId, setEmpresaId] = useState<string>("__all__")
  const [periodo, setPeriodo] = useState<string>("365")
  const [ufFiltro, setUfFiltro] = useState<string>("__all__")
  const [pagina, setPagina] = useState<number>(1)
  const tabelaRef = useRef<HTMLDivElement>(null)

  const irParaPagina = useCallback((nova: number) => {
    setPagina(nova)
    tabelaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const empresaSelecionada = empresas.find((e) => e.id === empresaId)

  const licitacoesComScore: LicitacaoComScore[] = useMemo(() => {
    setPagina(1)
    const cnaes = empresaSelecionada?.cnae ?? null
    const periodStart = calcPeriodStart(periodo)

    return licitacoes
      .filter((l) => {
        if (!l.data_encerramento) return false
        if (l.data_encerramento < periodStart) return false
        if (ufFiltro !== "__all__" && l.uf !== ufFiltro) return false
        return true
      })
      .map((l) => {
        const { score, label } = calcScore(l.objeto, cnaes)
        return { ...l, score, scoreLabel: label }
      })
      .sort((a, b) => (b.valor_estimado ?? 0) - (a.valor_estimado ?? 0))
  }, [licitacoes, empresaSelecionada, periodo, ufFiltro])

  const totalPaginas = Math.ceil(licitacoesComScore.length / PAGE_SIZE)
  const paginaAtual = Math.min(pagina, Math.max(1, totalPaginas))
  const inicio = (paginaAtual - 1) * PAGE_SIZE
  const fim = Math.min(inicio + PAGE_SIZE, licitacoesComScore.length)
  const licitacoesPagina = licitacoesComScore.slice(inicio, fim)

  const totalValor = licitacoesComScore.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0)
  const ufsUnicas = Array.from(new Set(licitacoesComScore.map((l) => l.uf).filter(Boolean)))
  const mediaPerMes = Math.round(licitacoesComScore.length / Math.max(1, parseInt(periodo) / 30))

  const allUfs = Array.from(new Set(licitacoes.map((l) => l.uf).filter(Boolean))).sort() as string[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-950/60 border border-red-800/40">
            <TrendingDown className="h-5 w-5 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Licitações que você perdeu</h1>
        </div>
        <p className="text-sm text-slate-400 ml-11">
          Nos últimos 12 meses, estas oportunidades encerraram sem a sua participação
        </p>
      </div>

      {/* Cards de impacto */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ImpactCard
          icon={AlertTriangle}
          label="Licitações perdidas"
          value={licitacoesComScore.length.toLocaleString("pt-BR")}
          sub="no período selecionado"
          color="bg-gradient-to-br from-red-500 to-red-600"
        />
        <ImpactCard
          icon={DollarSign}
          label="Contratos perdidos"
          value={
            totalValor > 0
              ? totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
              : "—"
          }
          sub="valor estimado total"
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <ImpactCard
          icon={MapPin}
          label="Estados"
          value={ufsUnicas.length.toString()}
          sub="com oportunidades perdidas"
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <ImpactCard
          icon={Calendar}
          label="Média mensal"
          value={mediaPerMes.toLocaleString("pt-BR")}
          sub="licitações/mês perdidas"
          color="bg-gradient-to-br from-rose-500 to-rose-600"
        />
      </div>

      {/* Filtros */}
      <div
        className="rounded-2xl p-5 flex flex-wrap gap-4 items-end"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <p className="text-sm font-medium text-slate-300 shrink-0">Filtros</p>
        </div>

        {empresas.length > 1 && (
          <div className="flex flex-col gap-1 min-w-[200px]">
            <p className="text-xs text-slate-500 font-medium">Empresa</p>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white [&>span]:text-white">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="__all__" className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">
                  Todas as empresas
                </SelectItem>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">
                    {e.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1 min-w-[160px]">
          <p className="text-xs text-slate-500 font-medium">Período</p>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white [&>span]:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="30" className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">Últimos 30 dias</SelectItem>
              <SelectItem value="90" className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">Últimos 90 dias</SelectItem>
              <SelectItem value="180" className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">Últimos 6 meses</SelectItem>
              <SelectItem value="365" className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {allUfs.length > 0 && (
          <div className="flex flex-col gap-1 min-w-[140px]">
            <p className="text-xs text-slate-500 font-medium">UF</p>
            <Select value={ufFiltro} onValueChange={setUfFiltro}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white [&>span]:text-white">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                <SelectItem value="__all__" className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">Todos os estados</SelectItem>
                {allUfs.map((uf) => (
                  <SelectItem key={uf} value={uf} className="text-white focus:bg-slate-700 focus:text-white cursor-pointer">
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tabela */}
      {licitacoes.length === 0 ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <TrendingDown className="h-12 w-12 text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-300">Nenhuma licitação encerrada encontrada</p>
          <p className="text-xs text-slate-500 mt-1">
            Quando licitações forem encerradas, elas aparecerão aqui
          </p>
        </div>
      ) : (
        <div
          ref={tabelaRef}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {licitacoesComScore.length.toLocaleString("pt-BR")} licitações encerradas
            </h2>
            <span className="text-xs text-slate-500">Ordenadas por maior valor</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Objeto</th>
                  <th className="text-left px-4 py-3 font-medium">Órgão</th>
                  <th className="text-left px-4 py-3 font-medium w-12">UF</th>
                  <th className="text-right px-4 py-3 font-medium">Valor Estimado</th>
                  <th className="text-left px-4 py-3 font-medium">Encerramento</th>
                  <th className="text-left px-4 py-3 font-medium">Compat.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {licitacoesPagina.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-sm text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                        {l.objeto ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">{l.orgao ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {l.uf && (
                        <span className="text-xs font-medium text-slate-300 bg-slate-800/60 border border-slate-700 rounded px-1.5 py-0.5">
                          {l.uf}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold text-red-400">
                        {formatCurrency(l.valor_estimado)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-400">{formatDate(l.data_encerramento)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getScoreClass(l.scoreLabel)}`}>
                        {l.scoreLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-white/[0.06]">
            {licitacoesPagina.map((l) => (
              <div key={l.id} className="p-4 space-y-2">
                <p className="text-sm text-slate-200 line-clamp-2 leading-snug">{l.objeto ?? "—"}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{l.orgao ?? "—"}</span>
                  {l.uf && (
                    <span className="font-medium text-slate-300 bg-slate-800/60 border border-slate-700 rounded px-1.5 py-0.5">
                      {l.uf}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(l.valor_estimado)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{formatDate(l.data_encerramento)}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getScoreClass(l.scoreLabel)}`}>
                      {l.scoreLabel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="px-5 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Exibindo {(inicio + 1).toLocaleString("pt-BR")}–{fim.toLocaleString("pt-BR")} de{" "}
                {licitacoesComScore.length.toLocaleString("pt-BR")} licitações encerradas
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => irParaPagina(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>
                <span className="text-xs text-slate-400 px-2">
                  Página {paginaAtual.toLocaleString("pt-BR")} de {totalPaginas.toLocaleString("pt-BR")}
                </span>
                <button
                  onClick={() => irParaPagina(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA verde */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-950/60 border border-emerald-800/40">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white mb-0.5">
            Não perca mais nenhuma!
          </h2>
          <p className="text-sm text-slate-400">
            A partir de agora, o LicitaAI monitora tudo para você — alertas em tempo real, matching por CNAE e análise de editais com IA.
          </p>
        </div>
        <Link
          href="/oportunidades"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 whitespace-nowrap"
        >
          Ver oportunidades ativas agora
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
