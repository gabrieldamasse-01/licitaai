"use client"

import { useEffect, useRef, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { motion, useInView, useSpring, useTransform } from "motion/react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DadosMonitoramento {
  valorTotalMonitorado: number
  totalLicitacoesArea: number
  totalLicitacoesSalvas: number
  barras: { mes: string; valor: number }[]
  pizza: { area: string; valor: number; cor: string }[]
}

// ─── Número animado ───────────────────────────────────────────────────────────

function NumeroAnimado({ valor, prefixo = "", sufixo = "", className = "" }: {
  valor: number
  prefixo?: string
  sufixo?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v) => {
    if (v >= 1_000_000) return `${prefixo}${(v / 1_000_000).toFixed(1)}M${sufixo}`
    if (v >= 1_000) return `${prefixo}${(v / 1_000).toFixed(0)}K${sufixo}`
    return `${prefixo}${Math.round(v).toLocaleString("pt-BR")}${sufixo}`
  })

  useEffect(() => {
    if (inView) spring.set(valor)
  }, [inView, valor, spring])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}

// ─── Tooltip pizza ────────────────────────────────────────────────────────────

function TooltipPizza({ active, payload }: { active?: boolean; payload?: { payload: { area: string; valor: number } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white">{d.area}</p>
      <p className="text-slate-400">
        {d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
      </p>
    </div>
  )
}

// ─── Tooltip barra ────────────────────────────────────────────────────────────

function TooltipBarra({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="font-semibold text-white">
        {payload[0].value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
      </p>
    </div>
  )
}

// ─── Gráfico de barras estilo trade com fio animado ───────────────────────────

function GraficoTrade({ barras }: { barras: { mes: string; valor: number }[] }) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true })
  const [progresso, setProgresso] = useState(0)

  const WIDTH = 600
  const HEIGHT = 180
  const PAD_LEFT = 8
  const PAD_RIGHT = 8
  const PAD_TOP = 16
  const PAD_BOTTOM = 32

  const maxVal = Math.max(...barras.map((b) => b.valor), 1)
  const barWidth = (WIDTH - PAD_LEFT - PAD_RIGHT) / barras.length
  const chartH = HEIGHT - PAD_TOP - PAD_BOTTOM

  // pontos de topo de cada barra (centro X, topo Y)
  const pontos = barras.map((b, i) => {
    const x = PAD_LEFT + i * barWidth + barWidth / 2
    const h = (b.valor / maxVal) * chartH
    const y = PAD_TOP + chartH - h
    return { x, y, valor: b.valor, mes: b.mes }
  })

  // path do fio
  const path = pontos.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pontos[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
  }, "")

  useEffect(() => {
    if (!inView) return
    let frame: number
    let start: number | null = null
    const duration = 1400
    const animate = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setProgresso(p)
      if (p < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [inView])

  // stroke-dashoffset trick: medir comprimento do path
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLen, setPathLen] = useState(1000)
  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength())
  }, [barras])

  const dashOffset = pathLen * (1 - progresso)

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      style={{ height: HEIGHT }}
    >
      {/* Grade horizontal */}
      {[0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD_TOP + chartH * (1 - t)
        return (
          <line
            key={t}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        )
      })}

      {/* Barras */}
      {pontos.map((p, i) => {
        const h = (barras[i].valor / maxVal) * chartH
        const barH = Math.max(h * progresso, 2)
        const isLast = i === barras.length - 1
        const cor = isLast
          ? barras[i].valor >= (barras[i - 1]?.valor ?? 0)
            ? "#22c55e"
            : "#ef4444"
          : "#3b82f6"

        return (
          <g key={i}>
            <rect
              x={p.x - barWidth * 0.35}
              y={PAD_TOP + chartH - barH}
              width={barWidth * 0.7}
              height={barH}
              rx={3}
              fill={cor}
              fillOpacity={0.25}
            />
            <rect
              x={p.x - barWidth * 0.35}
              y={PAD_TOP + chartH - barH}
              width={barWidth * 0.7}
              height={2}
              rx={1}
              fill={cor}
              fillOpacity={0.9}
            />
            {/* label mês */}
            <text
              x={p.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={11}
              fill="rgba(255,255,255,0.4)"
            >
              {barras[i].mes}
            </text>
          </g>
        )
      })}

      {/* Fio animado */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke="rgba(99,102,241,0.3)"
        strokeWidth={2}
        strokeDasharray={pathLen}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fio brilhante */}
      <path
        d={path}
        fill="none"
        stroke="#818cf8"
        strokeWidth={1.5}
        strokeDasharray={pathLen}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 4px #818cf8)" }}
      />

      {/* Pontos nos topos */}
      {pontos.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#818cf8"
          fillOpacity={progresso}
          style={{ filter: "drop-shadow(0 0 3px #818cf8)" }}
        />
      ))}
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GraficoMonitoramento({ dados }: { dados: DadosMonitoramento }) {
  const valorPerdido = dados.totalLicitacoesArea > 0
    ? ((dados.totalLicitacoesArea - dados.totalLicitacoesSalvas) / dados.totalLicitacoesArea) * dados.valorTotalMonitorado
    : 0

  const pctCapturado = dados.totalLicitacoesArea > 0
    ? Math.round((dados.totalLicitacoesSalvas / dados.totalLicitacoesArea) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* ─ Topo: número grande + pizza ─ */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

        {/* Valor total monitorado */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Valor Total Monitorado</p>
          <div className="mt-3">
            <p className="text-5xl font-black text-white leading-none">
              <NumeroAnimado valor={dados.valorTotalMonitorado / 1_000_000} prefixo="R$" sufixo="M" />
            </p>
            <p className="text-sm text-slate-400 mt-2">Soma das licitações salvas com valor estimado</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xl font-bold text-emerald-400">
                <NumeroAnimado valor={dados.totalLicitacoesSalvas} />
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Licitações salvas</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xl font-bold text-rose-400">
                <NumeroAnimado valor={dados.totalLicitacoesArea - dados.totalLicitacoesSalvas} />
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Não capturadas na área</p>
            </div>
          </div>
        </div>

        {/* Gráfico pizza */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Distribuição por Área</p>
              <p className="text-sm text-slate-400 mt-0.5">
                {pctCapturado}% capturado · {100 - pctCapturado}% não monitorado
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dados.pizza}
                    dataKey="valor"
                    nameKey="area"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {dados.pizza.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPizza />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              {dados.pizza.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 min-w-0">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.cor }} />
                  <span className="truncate text-xs text-slate-400">{entry.area}</span>
                  <span className="ml-auto shrink-0 text-xs font-semibold text-white">
                    {entry.valor >= 1_000_000
                      ? `R$ ${(entry.valor / 1_000_000).toFixed(1)}M`
                      : `R$ ${(entry.valor / 1_000).toFixed(0)}K`}
                  </span>
                </div>
              ))}
              {/* Valor perdido */}
              <div className="mt-1 rounded-lg bg-rose-950/40 border border-rose-800/30 px-3 py-2">
                <p className="text-[11px] text-rose-400 font-semibold">Potencial não capturado</p>
                <p className="text-xs text-rose-300 font-bold">
                  {valorPerdido >= 1_000_000
                    ? `R$ ${(valorPerdido / 1_000_000).toFixed(1)}M`
                    : `R$ ${(valorPerdido / 1_000).toFixed(0)}K`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─ Gráfico estilo trade ─ */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Evolução do Valor Monitorado</p>
            <p className="text-xs text-slate-500 mt-0.5">Últimos meses · valor estimado das licitações salvas</p>
          </div>
          {dados.barras.length >= 2 && (
            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
              dados.barras[dados.barras.length - 1].valor >= dados.barras[dados.barras.length - 2].valor
                ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/40"
                : "bg-rose-950/50 text-rose-400 border-rose-800/40"
            }`}>
              {dados.barras[dados.barras.length - 1].valor >= dados.barras[dados.barras.length - 2].valor ? "▲" : "▼"}{" "}
              {Math.abs(
                ((dados.barras[dados.barras.length - 1].valor - dados.barras[dados.barras.length - 2].valor) /
                  Math.max(dados.barras[dados.barras.length - 2].valor, 1)) * 100
              ).toFixed(0)}%
            </span>
          )}
        </div>
        <GraficoTrade barras={dados.barras} />
      </div>
    </div>
  )
}
