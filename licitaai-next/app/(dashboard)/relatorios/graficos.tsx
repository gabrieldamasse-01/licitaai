"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export type MesData = {
  mes: string
  quantidade: number
}

export type EmpresaDocData = {
  empresa: string
  validos: number
  vencendo: number
  expirados: number
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function GraficoSkeleton() {
  return (
    <div className="h-64 w-full animate-pulse rounded-lg bg-slate-100" />
  )
}

// ─── Oportunidades por mês ────────────────────────────────────────────────────

export function GraficoOportunidadesMes({ data }: { data: MesData[] }) {
  if (data.every((d) => d.quantidade === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Nenhuma oportunidade salva nos últimos 6 meses
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: 13,
          }}
          formatter={(value) => [value, "Oportunidades"]}
        />
        <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Status de documentos por empresa ─────────────────────────────────────────

export function GraficoDocsEmpresa({ data }: { data: EmpresaDocData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Nenhuma empresa com documentos cadastrados
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        barSize={24}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="empresa"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={data.length > 4 ? -25 : 0}
          textAnchor={data.length > 4 ? "end" : "middle"}
          height={data.length > 4 ? 48 : 30}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: 13,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value: string) =>
            value === "validos"
              ? "Válidos"
              : value === "vencendo"
                ? "Vencendo"
                : "Expirados"
          }
        />
        <Bar dataKey="validos" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar dataKey="vencendo" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
        <Bar dataKey="expirados" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
