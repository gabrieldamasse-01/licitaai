import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdmin } from "@/lib/is-admin"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const inicio = searchParams.get("inicio")
  const fim = searchParams.get("fim")

  if (!inicio || !fim) {
    return NextResponse.json({ error: "Parâmetros inicio e fim são obrigatórios" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("licitacoes")
    .select("id, objeto, orgao, uf, valor_estimado, modalidade, portal, status, data_publicacao")
    .gte("data_publicacao", inicio)
    .lte("data_publicacao", fim)
    .order("data_publicacao", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ licitacoes: data ?? [] })
}
