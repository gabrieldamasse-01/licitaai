"use client"

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"

const TOOLTIP_STYLE = {
  background: "rgba(15,23,42,0.85)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  backdropFilter: "blur(20px)",
  color: "white",
  fontSize: "13px",
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

// ─── Gráfico 1: Licitações por UF ────────────────────────────────────────────

interface DadosUF {
  uf: string
  total: number
}

export function GraficoLicitacoesPorUF({ dados }: { dados: DadosUF[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="uf"
          tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={TOOLTIP_STYLE}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [(value as number).toLocaleString("pt-BR"), "Licitações"]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(label: any) => `UF: ${label}`}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Gráfico 2: Licitações por Modalidade ────────────────────────────────────

interface DadosModalidade {
  modalidade: string
  total: number
}

const renderCustomLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  if (
    cx == null || cy == null || midAngle == null ||
    innerRadius == null || outerRadius == null || percent == null ||
    percent < 0.05
  ) return null
  const RADIAN = Math.PI / 180
  const ri = Number(innerRadius)
  const ro = Number(outerRadius)
  const radius = ri + (ro - ri) * 0.5
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN)
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(Number(percent) * 100).toFixed(0)}%`}
    </text>
  )
}

export function GraficoModalidades({ dados }: { dados: DadosModalidade[] }) {
  const abreviado = dados.map((d) => ({
    ...d,
    label: d.modalidade.replace("Eletrônico", "Eletr.").replace("Presencial", "Pres.").slice(0, 22),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={abreviado}
          dataKey="total"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius={90}
          labelLine={false}
          label={renderCustomLabel}
        >
          {abreviado.map((_, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [(value as number).toLocaleString("pt-BR"), "Licitações"]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", paddingTop: "8px" }}
          formatter={(value: string) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Gráfico 3: Licitações por dia (últimos 30 dias) ─────────────────────────

interface DadosDia {
  dia: string
  total: number
}

export function GraficoLicitacoesPorDia({ dados }: { dados: DadosDia[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={dados} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="dia"
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.1)" }}
          contentStyle={TOOLTIP_STYLE}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [(value as number).toLocaleString("pt-BR"), "Inseridas"]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(label: any) => `Dia: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#10b981" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
