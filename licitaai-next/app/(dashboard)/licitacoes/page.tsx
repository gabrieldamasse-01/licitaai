export const revalidate = 60

import { Suspense } from "react"
import { createClient } from '@/lib/supabase/server'
import { fetchLicitacoes } from "./actions"
import { LicitacoesClient } from "./licitacoes-client"
import { getUserPlan } from "@/lib/get-user-plan"
import { isPlanoPago } from "@/lib/plans"
import LicitacoesLoading from "./loading"

async function LicitacoesConteudo() {
  const [supabase, plano] = await Promise.all([createClient(), getUserPlan()])
  const { data: { user } } = await supabase.auth.getUser()
  const isGratuito = !isPlanoPago(plano)

  const [dadosIniciais, prefsResult] = await Promise.all([
    fetchLicitacoes({ pagina: 0 }),
    user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any)
          .from('user_preferences')
          .select('keywords')
          .eq('user_id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const userKeywords: string[] = Array.isArray(prefsResult.data?.keywords)
    ? prefsResult.data.keywords
    : []

  return <LicitacoesClient dadosIniciais={dadosIniciais} userKeywords={userKeywords} isGratuito={isGratuito} />
}

export default function LicitacoesPage() {
  return (
    <Suspense fallback={<LicitacoesLoading />}>
      <LicitacoesConteudo />
    </Suspense>
  )
}
