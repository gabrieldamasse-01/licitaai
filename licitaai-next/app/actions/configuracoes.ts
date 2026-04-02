'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const EmailSchema = z.object({
  email_contato: z.string().email('Informe um e-mail válido'),
})

export async function salvarEmailContato(
  _: unknown,
  formData: FormData,
): Promise<{ ok: true } | { erro: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
