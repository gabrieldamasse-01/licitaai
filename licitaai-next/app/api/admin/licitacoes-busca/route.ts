import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdmin } from "@/lib/is-admin"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const adminOk = await isAdmin()
  if (!adminOk) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const inicio = searchParams.get("inicio")
  const fim = searchParams.get("fim")
  const companyId = searchParams.get("company_id") // UUID da company (opcional)

  if (!inicio || !fim) {
    return NextResponse.json({ error: "Parâmetros inicio e fim são obrigatórios" }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Se filtrar por company, buscar via matches
  if (companyId) {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id,
        relevancia_score,
        keywords_matched,
        created_at,
        licitacoes!inner(
          id,
          orgao,
          uf,
          objeto,
          valor_estimado,
          data_abertura,
          portal,
          modalidade,
          status,
          source_url
        )
      `)
      .eq("company_id", companyId)
      .gte("created_at", inicio)
      .lte("created_at", fim)
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    type LicRow = {
      id: string
      orgao: string | null
      uf: string | null
      objeto: string | null
      valor_estimado: number | null
      data_abertura: string | null
      portal: string | null
      modalidade: string | null
      status: string | null
      source_url: string | null
    }

    const licitacoes = (data ?? []).map((m) => {
      // Supabase returns joined table as array when using !inner
      const licRaw = m.licitacoes as unknown
      const lic: LicRow = Array.isArray(licRaw) ? (licRaw[0] as LicRow) : (licRaw as LicRow)
      return {
        id: lic?.id ?? m.id,
        match_id: m.id,
        orgao: lic?.orgao ?? "—",
        uf: lic?.uf ?? "—",
        objeto: lic?.objeto ?? "—",
        valor_estimado: lic?.valor_estimado ?? null,
        data_abertura: lic?.data_abertura ?? null,
        portal: lic?.portal ?? "—",
        modalidade: lic?.modalidade ?? "—",
        status: lic?.status ?? "—",
        source_url: lic?.source_url ?? null,
        relevancia_score: (m.relevancia_score as number | null) ?? 0,
        keywords_matched: (m.keywords_matched as string[] | null) ?? [],
      }
    })

    return NextResponse.json({ licitacoes })
  }

  // Sem filtro de company — buscar direto na tabela licitacoes
  const { data, error } = await supabase
    .from("licitacoes")
    .select("id, orgao, uf, objeto, valor_estimado, data_abertura, portal, modalidade, status, source_url")
    .gte("created_at", inicio)
    .lte("created_at", fim)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const licitacoes = (data ?? []).map((lic) => ({
    id: lic.id as string,
    match_id: null,
    orgao: (lic.orgao as string | null) ?? "—",
    uf: (lic.uf as string | null) ?? "—",
    objeto: (lic.objeto as string | null) ?? "—",
    valor_estimado: (lic.valor_estimado as number | null) ?? null,
    data_abertura: (lic.data_abertura as string | null) ?? null,
    portal: (lic.portal as string | null) ?? "—",
    modalidade: (lic.modalidade as string | null) ?? "—",
    status: (lic.status as string | null) ?? "—",
    source_url: (lic.source_url as string | null) ?? null,
    relevancia_score: 0,
    keywords_matched: [] as string[],
  }))

  return NextResponse.json({ licitacoes })
}
