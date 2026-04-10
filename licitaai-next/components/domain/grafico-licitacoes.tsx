"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const dados = [
  { mes: "Out", total: 12 },
  { mes: "Nov", total: 19 },
  { mes: "Dez", total: 8 },
  { mes: "Jan", total: 24 },
  { mes: "Fev", total: 31 },
  { mes: "Mar", total: 17 },
]

export function GraficoLicitacoes() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={dados}
        barSize={32}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        style={{ background: "transparent" }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          contentStyle={{
            backgroundColor: "rgba(15,15,30,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "white",
            fontSize: "13px",
          }}
          formatter={(value) => [value, "Licitações"]}
          labelFormatter={(label) => `Mês: ${label}`}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
