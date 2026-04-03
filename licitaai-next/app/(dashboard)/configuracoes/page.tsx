import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesClient } from '@/components/configuracoes-client'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, razao_social, cnpj, email_contato, contato, cnae')
    .eq('user_id', user.id)
    .single()

  // user_preferences pode não existir ainda (tabela criada via migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prefs } = await (supabase as any)
    .from('user_preferences')
    .select('alertas_email, alert_days, alert_email')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-slate-400 mt-1">
          Gerencie o perfil, CNAEs e preferências de alerta
          {company?.razao_social ? ` de ${company.razao_social}` : ''}.
        </p>
      </div>

      <ConfiguracoesClient
        company={company ?? null}
        prefs={
          prefs
            ? {
                alertas_email: prefs.alertas_email ?? true,
                alert_days: prefs.alert_days ?? 30,
                alert_email: prefs.alert_email ?? '',
              }
            : { alertas_email: true, alert_days: 30, alert_email: '' }
        }
        userEmail={user.email ?? ''}
      />
    </div>
  )
}
