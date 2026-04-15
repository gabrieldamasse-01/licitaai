import { createClient } from '@/lib/supabase/server'
import { fetchLicitacoes } from "./actions"
import { LicitacoesClient } from "./licitacoes-client"

export default async function LicitacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  return <LicitacoesClient dadosIniciais={dadosIniciais} userKeywords={userKeywords} />
}
