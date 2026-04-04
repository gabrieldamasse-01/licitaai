import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// App Router lê o body via req.text() — sem necessidade de desabilitar bodyParser
export const runtime = 'nodejs'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: 'Configuração de webhook inválida' },
      { status: 400 },
    )
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] Assinatura inválida:', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  const supabase = getServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    if (!userId) return NextResponse.json({ received: true })

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const { error } = await supabase.from('user_preferences').upsert(
      {
        user_id: userId,
        plano: 'pro',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plano_expira_em: expiresAt.toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('[stripe/webhook] Erro ao salvar plano:', error)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.user_id
    if (!userId) return NextResponse.json({ received: true })

    const { error } = await supabase
      .from('user_preferences')
      .update({
        plano: 'gratuito',
        stripe_subscription_id: null,
        plano_expira_em: null,
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[stripe/webhook] Erro ao reverter plano:', error)
    }
  }

  return NextResponse.json({ received: true })
}
