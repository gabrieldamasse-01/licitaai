import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesEmail } from '@/components/configuracoes-client'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: company } = await supabase
    .from('companies')
    .select('razao_social, email_contato')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500 mt-1">
          Preferências de notificação
          {company?.razao_social ? ` de ${company.razao_social}` : ''}.
        </p>
      </div>

      <ConfiguracoesEmail emailAtual={company?.email_contato ?? null} />
    </div>
  )
}
