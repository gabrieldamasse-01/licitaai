"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdmin } from "@/lib/is-admin"
import { resend, FROM_EMAIL } from "@/lib/resend"

const MASTER_EMAIL = "gabriel.damasse@mgnext.com"

export async function adicionarAdmin(formData: {
  email: string
  nome: string
  cargo: string
}): Promise<{ success?: true; error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  const supabase = await createClient()
  const {
    data: { user: caller },
  } = await supabase.auth.getUser()

  const admin = createServiceClient()

  // Buscar usuário por email em auth.users
  const { data: authData, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (listError) return { error: "Erro ao buscar usuários." }

  const targetUser = authData.users.find(
    (u) => u.email?.toLowerCase() === formData.email.toLowerCase(),
  )

  if (!targetUser) {
    return { error: "Usuário não encontrado na plataforma." }
  }

  // Verificar se já é admin
  const { data: existing } = await admin
    .from("admin_users")
    .select("id, ativo")
    .eq("user_id", targetUser.id)
    .maybeSingle()

  if (existing) {
    if (existing.ativo) {
      return { error: "Este usuário já é um administrador ativo." }
    }
    // Reativar se estava inativo
    const { error: updateError } = await admin
      .from("admin_users")
      .update({ ativo: true, cargo: formData.cargo || null })
      .eq("id", existing.id)

    if (updateError) return { error: "Erro ao reativar administrador." }

    revalidatePath("/admin")
    return { success: true }
  }

  // Inserir novo admin
  const { error: insertError } = await admin.from("admin_users").insert({
    user_id: targetUser.id,
    email: targetUser.email ?? formData.email,
    nome: formData.nome,
    cargo: formData.cargo || null,
    ativo: true,
    adicionado_por: caller?.id ?? null,
  })

  if (insertError) return { error: "Erro ao adicionar administrador." }

  revalidatePath("/admin")
  return { success: true }
}

export async function toggleAdmin(
  adminUserId: string,
  ativo: boolean,
): Promise<{ error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  const admin = createServiceClient()

  // Verificar se é o email master (protegido)
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("email")
    .eq("id", adminUserId)
    .maybeSingle()

  if (adminUser?.email === MASTER_EMAIL) {
    return { error: "Não é possível alterar o status do administrador master." }
  }

  const { error } = await admin
    .from("admin_users")
    .update({ ativo: !ativo })
    .eq("id", adminUserId)

  if (error) return { error: "Erro ao atualizar status do administrador." }

  revalidatePath("/admin")
  return {}
}

export async function resolverFeedback(
  feedbackId: string,
  resolvido: boolean,
): Promise<{ error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  const admin = createServiceClient()

  const { error } = await admin
    .from("feedback")
    .update({ resolvido })
    .eq("id", feedbackId)

  if (error) return { error: "Erro ao atualizar feedback." }

  revalidatePath("/admin")
  return {}
}

export async function enviarEmailAdmin(
  userEmail: string,
  assunto: string,
  mensagem: string,
): Promise<{ success?: true; error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  if (!userEmail || !assunto || !mensagem) {
    return { error: "Preencha todos os campos obrigatórios." }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${assunto}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:32px 40px;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                      LicitaAI
                    </h1>
                    <p style="margin:4px 0 0;color:#93c5fd;font-size:14px;">Plataforma de Licitações Inteligentes</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;font-weight:600;">${assunto}</h2>
                    <div style="color:#cbd5e1;font-size:15px;line-height:1.6;white-space:pre-wrap;">${mensagem}</div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #334155;">
                    <p style="margin:0;color:#64748b;font-size:12px;">
                      Esta mensagem foi enviada pela equipe LicitaAI.<br />
                      Em caso de dúvidas, entre em contato conosco.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: assunto,
      html,
    })

    if (error) return { error: "Erro ao enviar email." }

    return { success: true }
  } catch {
    return { error: "Erro inesperado ao enviar email." }
  }
}
