"use client"

import dynamic from "next/dynamic"
import { GraficoSkeleton, type MesData, type EmpresaDocData } from "./graficos"

const GraficoOportunidadesMesLazy = dynamic(
  () => import("./graficos").then((m) => m.GraficoOportunidadesMes),
  { ssr: false, loading: () => <GraficoSkeleton /> },
)

const GraficoDocsEmpresaLazy = dynamic(
  () => import("./graficos").then((m) => m.GraficoDocsEmpresa),
  { ssr: false, loading: () => <GraficoSkeleton /> },
)

export function GraficoOportunidadesMesWrapper({ data }: { data: MesData[] }) {
  return <GraficoOportunidadesMesLazy data={data} />
}

export function GraficoDocsEmpresaWrapper({ data }: { data: EmpresaDocData[] }) {
  return <GraficoDocsEmpresaLazy data={data} />
}
