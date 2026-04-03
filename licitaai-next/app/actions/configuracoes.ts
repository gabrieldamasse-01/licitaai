'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export { redirect }
