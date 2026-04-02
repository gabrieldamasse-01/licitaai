/**
 * Rota intermediária para testar o cron de alertas de forma autenticada.
 * Só pode ser chamada por usuários com sessão válida — nunca expõe CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest): Promise<NextResponse> {
  // Verificar autenticação — apenas usuários logados podem disparar o teste
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado no servidor' },
      { status: 500 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const response = await fetch(`${appUrl}/api/cron/alertas`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  })

  const body = (await response.json()) as Record<string, unknown>

  return NextResponse.json(body, { status: response.status })
}
