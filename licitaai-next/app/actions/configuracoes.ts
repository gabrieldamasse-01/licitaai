'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

// ─── Perfil ───────────────────────────────────────────────────────────────────

const PerfilSchema = z.object({
  razao_social: z.string().min(2, 'Informe a razão social'),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (formato: 00.000.000/0000-00)'),
  email_contato: z.string().email('E-mail inválido').or(z.literal('')),
  contato: z.string().optional(),
})

export async function salvarPerfil(
  _: unknown,
  formData: FormData,
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const parsed = PerfilSchema.safeParse({
    razao_social: formData.get('razao_social'),
    cnpj: formData.get('cnpj'),
    email_contato: formData.get('email_contato') ?? '',
    contato: formData.get('contato') ?? '',
  })
  if (!parsed.success) return { erro: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('companies')
    .update({
      razao_social: parsed.data.razao_social,
      cnpj: parsed.data.cnpj,
      email_contato: parsed.data.email_contato || null,
      contato: parsed.data.contato || null,
    })
    .eq('user_id', user.id)

  if (error) return { erro: error.message }
  revalidatePath('/configuracoes')
  return { ok: true }
}

// ─── CNAEs ────────────────────────────────────────────────────────────────────

export async function salvarCnaes(
  cnaes: string[],
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const lista = cnaes.map((c) => c.trim()).filter(Boolean)

  const { error } = await supabase
    .from('companies')
    .update({ cnae: lista })
    .eq('user_id', user.id)

  if (error) return { erro: error.message }
  revalidatePath('/configuracoes')
  return { ok: true }
}

// ─── Preferências de alerta ───────────────────────────────────────────────────

const PreferenciasSchema = z.object({
  alertas_email: z.boolean(),
  alert_days: z.enum(['7', '15', '30']).transform(Number),
  alert_email: z.string().email('E-mail inválido').or(z.literal('')),
})

export async function salvarPreferencias(
  _: unknown,
  formData: FormData,
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const parsed = PreferenciasSchema.safeParse({
    alertas_email: formData.get('alertas_email') === 'true',
    alert_days: formData.get('alert_days') ?? '30',
    alert_email: formData.get('alert_email') ?? '',
  })
  if (!parsed.success) return { erro: parsed.error.issues[0].message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_preferences')
    .upsert(
      {
        user_id: user.id,
        alertas_email: parsed.data.alertas_email,
        alert_days: parsed.data.alert_days,
        alert_email: parsed.data.alert_email || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) return { erro: error.message }
  revalidatePath('/configuracoes')
  return { ok: true }
}

// ─── Reset de senha ───────────────────────────────────────────────────────────

export async function enviarResetSenha(): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { erro: 'Usuário sem e-mail cadastrado' }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://licitaai-next.vercel.app'}/auth/update-password`,
  })

  if (error) return { erro: error.message }
  return { ok: true }
}

// ─── Toggle 2FA ───────────────────────────────────────────────────────────────

export async function toggle2FA(
  enabled: boolean,
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_preferences')
    .upsert(
      { user_id: user.id, two_factor_enabled: enabled, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) return { erro: error.message }
  revalidatePath('/configuracoes')
  return { ok: true }
}

// ─── Excluir conta ────────────────────────────────────────────────────────────

export async function excluirConta(): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const service = createServiceClient()

  // 1. Buscar companies do usuário para excluir arquivos de storage
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)

  // 2. Excluir arquivos do Storage (pasta do usuário)
  const { data: storageFiles } = await service.storage
    .from('documentos')
    .list(user.id, { limit: 1000 })

  if (storageFiles && storageFiles.length > 0) {
    const paths = storageFiles.map((f) => `${user.id}/${f.name}`)
    await service.storage.from('documentos').remove(paths)
  }

  // 3. Excluir dados relacionados via cascade (companies → documents → matches)
  if (companies && companies.length > 0) {
    const ids = companies.map((c) => c.id)
    await service.from('documents').delete().in('company_id', ids)
    await service.from('matches').delete().in('company_id', ids)
    await service.from('companies').delete().in('id', ids)
  }

  // 4. Excluir preferências e notificações
  await service.from('user_preferences').delete().eq('user_id', user.id)
  await service.from('notifications').delete().eq('user_id', user.id)

  // 5. Fazer logout antes de deletar o usuário auth
  await supabase.auth.signOut()

  // 6. Deletar o usuário do auth (requer service role)
  const { error: deleteError } = await service.auth.admin.deleteUser(user.id)
  if (deleteError) return { erro: 'Erro ao excluir conta: ' + deleteError.message }

  redirect('/auth/login')
}

// ─── Manter compatibilidade com código anterior ───────────────────────────────

const EmailSchema = z.object({
  email_contato: z.string().email({ message: 'Informe um e-mail válido' }),
})

export async function salvarEmailContato(
  _: unknown,
  formData: FormData,
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const parsed = EmailSchema.safeParse({ email_contato: formData.get('email_contato') })
  if (!parsed.success) return { erro: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('companies')
    .update({ email_contato: parsed.data.email_contato })
    .eq('user_id', user.id)

  if (error) return { erro: error.message }
  revalidatePath('/(dashboard)/configuracoes')
  return { ok: true }
}

