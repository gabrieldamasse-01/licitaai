import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) {
    return NextResponse.json(
      { error: 'STRIPE_PRO_PRICE_ID não configurado' },
      { status: 500 },
    )
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  try {
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      priceId,
      successUrl: `${origin}/configuracoes?upgrade=success`,
      cancelUrl: `${origin}/configuracoes?upgrade=cancelled`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento' },
      { status: 500 },
    )
  }
}
