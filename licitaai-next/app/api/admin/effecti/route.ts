import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/is-admin"

const API_BASE = "https://mdw.minha.effecti.com.br/api-integracao/v1"
const TOKEN = `Bearer ${process.env.EFFECTI_TOKEN}`

export async function POST(req: NextRequest): Promise<NextResponse> {
  const adminOk = await isAdmin()
  if (!adminOk) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { begin, end, page } = await req.json()

  if (!begin || !end) {
    return NextResponse.json({ error: "begin e end são obrigatórios" }, { status: 400 })
  }

  const pageNum = page ?? 0

  try {
    const body = JSON.stringify({ begin, end })
    const url = `${API_BASE}/aviso/licitacao?page=${pageNum}`

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: TOKEN,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(30000),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json(
        { error: `Effecti API error (${resp.status}): ${text.substring(0, 200)}` },
        { status: resp.status }
      )
    }

    const data = await resp.json()

    let totalRegistros = 0
    let totalPaginas = 1
    let paginaAtual = pageNum

    const meta = data._metadata || data.metadata
    if (meta) {
      const m = Array.isArray(meta) ? meta[0] : meta
      if (m) {
        totalRegistros = m.total_registros || 0
        totalPaginas = m.total_paginas || 1
        paginaAtual = m.pagina_atual ?? pageNum
      }
    }

    const licitacoes = data.licitacoes || (Array.isArray(data) ? data : [])

    return NextResponse.json({
      licitacoes,
      pagination: {
        total_registros: totalRegistros,
        total_paginas: totalPaginas,
        pagina_atual: paginaAtual,
        itens_nesta_pagina: licitacoes.length,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
