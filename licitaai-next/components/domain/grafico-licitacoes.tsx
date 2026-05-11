"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const dados = [
  { mes: "Dez", total: 142 },
  { mes: "Jan", total: 198 },
  { mes: "Fev", total: 173 },
  { mes: "Mar", total: 221 },
  { mes: "Abr", total: 189 },
  { mes: "Mai", total: 234 },
]

const TOOLTIP_STYLE = {
  background: "rgba(15,23,42,0.85)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  backdropFilter: "blur(20px)",
  color: "white",
  fontSize: "13px",
}

export function GraficoLicitacoes() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: "rgba(255,255,255,0.45)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={TOOLTIP_STYLE}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [(value as number).toLocaleString("pt-BR"), "Licitações"]}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
