import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PerfilClient } from './perfil-client'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [{ data: company }, { data: prefs }, { data: notificacoes }, { data: matches }] =
    await Promise.all([
      supabase
        .from('companies')
        .select('id, razao_social, cnpj, email_contato, contato')
        .eq('user_id', user.id)
        .single(),
      sb
        .from('user_preferences')
        .select('plano, plano_expira_em, created_at')
        .eq('user_id', user.id)
        .single(),
      sb
        .from('notifications')
        .select('id, titulo, mensagem, tipo, created_at, lida')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8),
      sb
        .from('matches')
        .select('id, created_at, relevancia_score')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  return (
    <PerfilClient
      user={{ id: user.id, email: user.email ?? '', createdAt: user.created_at }}
      company={company ?? null}
      plano={prefs?.plano ?? 'gratuito'}
      planoExpiraEm={prefs?.plano_expira_em ?? null}
      notificacoes={notificacoes ?? []}
      totalMatches={matches?.length ?? 0}
    />
  )
}
