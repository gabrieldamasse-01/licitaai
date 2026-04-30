import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdmin } from "@/lib/is-admin"

export const maxDuration = 300

const CAMPOS = [
  "id",
  "source_id",
  "portal",
  "orgao",
  "objeto",
  "modalidade",
  "uf",
  "municipio",
  "valor_estimado",
  "data_publicacao",
  "data_abertura",
  "data_encerramento",
  "status",
  "source_url",
  "created_at",
]

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET() {
  const adminOk = await isAdmin()
  if (!adminOk) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const supabase = createServiceClient()
  const LOTE = 1000
  let offset = 0
  const linhas: string[] = [CAMPOS.join(",")]

  while (true) {
    const { data, error } = await supabase
      .from("licitacoes")
      .select(CAMPOS.join(","))
      .range(offset, offset + LOTE - 1)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) break

    for (const row of data) {
      const r = row as unknown as Record<string, unknown>
      linhas.push(CAMPOS.map((c) => escapeCsv(r[c])).join(","))
    }

    if (data.length < LOTE) break
    offset += LOTE
  }

  const csv = linhas.join("\n")
  const data = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="licitacoes-${data}.csv"`,
    },
  })
}
