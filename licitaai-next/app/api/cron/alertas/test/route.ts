/**
 * Dispara manualmente o cron de alertas de documentos.
 * Aceita dois métodos de autenticação:
 *   1. Bearer <CRON_SECRET> no header Authorization (curl, testes automatizados)
 *   2. Sessão válida do Supabase (botão na UI)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado no servidor' },
      { status: 500 },
    )
  }

  // 1. Verificar Bearer token (deve ser CRON_SECRET)
  const authHeader = req.headers.get('authorization') ?? ''
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '')
  const autenticadoPorToken = bearerToken === cronSecret

  // 2. Verificar sessão Supabase (apenas se não autenticou via token)
  if (!autenticadoPorToken) {
    let user = null
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      // Sem contexto de cookies (ex: cron externo sem cookie) — trata como não autenticado
    }

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://licitaai-next.vercel.app'

  const response = await fetch(`${appUrl}/api/cron/alertas`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  const text = await response.text()
  let body: Record<string, unknown>
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : { error: 'Resposta vazia do cron' }
  } catch {
    body = { error: 'Resposta inválida do cron', raw: text }
  }

  return NextResponse.json(body, { status: response.status })
}
