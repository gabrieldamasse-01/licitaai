"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import {
  TrendingDown,
  DollarSign,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Filter,
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

function calcScore(objeto: string | null, cnaes: string[] | null): { score: number; label: string } {
  if (!objeto || !cnaes || cnaes.length === 0) return { score: 30, label: "Baixa" }
  const obj = objeto.toLowerCase()
  const matchCount = cnaes.filter((c) => obj.includes(c.toLowerCase().slice(0, 4))).length
  if (matchCount >= 2) return { score: 90, label: "Alta" }
  if (matchCount === 1) return { score: 65, label: "Media" }
  return { score: 30, label: "Baixa" }
}

function getScoreClass(label: string): string {
  if (label === "Alta") return "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
  if (label === "Media") return "bg-amber-950/60 text-amber-400 border-amber-800/50"
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

  const empresaSelecionada = empresas.find((e) => e.id === empresaId)

  const licitacoesComScore: LicitacaoComScore[] = useMemo(() => {
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
                {licitacoesComScore.slice(0, 100).map((l) => (
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
            {licitacoesComScore.length > 100 && (
              <p className="px-5 py-3 text-xs text-slate-500 border-t border-white/[0.06]">
                Mostrando as 100 primeiras de {licitacoesComScore.length.toLocaleString("pt-BR")} licitações
              </p>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-white/[0.06]">
            {licitacoesComScore.slice(0, 50).map((l) => (
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
