"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdmin } from "@/lib/is-admin"
import { resend, FROM_EMAIL } from "@/lib/resend"

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const adicionarAdminSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().max(100).optional(),
  cargo: z.string().max(100).optional(),
})

const MASTER_EMAIL = "gabriel.damasse@mgnext.com"

export async function adicionarAdmin(formData: {
  email: string
  nome: string
  cargo: string
}): Promise<{ success?: true; error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  const parsed = adicionarAdminSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }

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

export async function salvarPortalConfig(
  portal: string,
  ativo: boolean,
): Promise<{ error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  if (!["effecti", "pncp"].includes(portal)) {
    return { error: "Portal inválido." }
  }

  const admin = createServiceClient()

  const { error } = await admin
    .from("portal_config")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("portal", portal)

  if (error) return { error: "Erro ao salvar configuração." }

  revalidatePath("/admin")
  return {}
}

export async function listarAdmins(): Promise<{
  data?: Array<{ id: string; email: string; created_at: string }>
  error?: string
}> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from("admin_users")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })

  if (error) return { error: "Erro ao listar colaboradores." }
  return { data: data ?? [] }
}

export async function adicionarColaborador(
  email: string,
): Promise<{ success?: true; error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  const schema = z.object({ email: z.string().email(), nome: z.string().max(100).optional(), cargo: z.string().max(100).optional() })
  const parsed = schema.safeParse({ email })
  if (!parsed.success) return { error: "Dados inválidos" }

  if (!email.trim()) return { error: "Email é obrigatório." }

  const admin = createServiceClient()

  // Buscar usuário por email em auth.users
  const { data: authData, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (listError) return { error: "Erro ao buscar usuários." }

  const targetUser = authData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )
  if (!targetUser) return { error: "Usuário não encontrado na plataforma." }

  // Verificar se já existe
  const { data: existing } = await admin
    .from("admin_users")
    .select("id, ativo")
    .eq("user_id", targetUser.id)
    .maybeSingle()

  if (existing) {
    if (existing.ativo) return { error: "Este usuário já é colaborador ativo." }
    const { error: updateError } = await admin
      .from("admin_users")
      .update({ ativo: true })
      .eq("id", existing.id)
    if (updateError) return { error: "Erro ao reativar colaborador." }
    revalidatePath("/admin")
    return { success: true }
  }

  const { error: insertError } = await admin.from("admin_users").insert({
    user_id: targetUser.id,
    email: targetUser.email ?? email,
    nome: targetUser.email?.split("@")[0] ?? email,
    ativo: true,
  })

  if (insertError) return { error: "Erro ao adicionar colaborador." }

  revalidatePath("/admin")
  return { success: true }
}

export async function removerColaborador(
  email: string,
): Promise<{ error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  if (email === MASTER_EMAIL) {
    return { error: "Não é possível remover o administrador master." }
  }

  const admin = createServiceClient()
  const { error } = await admin
    .from("admin_users")
    .delete()
    .eq("email", email)
    .neq("email", MASTER_EMAIL)

  if (error) return { error: "Erro ao remover colaborador." }

  revalidatePath("/admin")
  return {}
}

export async function sincronizarPortal(
  portal: "effecti" | "pncp"
): Promise<{ success?: boolean; error?: string }> {
  const adminOk = await isAdmin()
  if (!adminOk) return { error: "Acesso negado." }

  const secret = process.env.CRON_SECRET ?? ""
  const url =
    portal === "effecti"
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://licitaai-next.vercel.app"}/api/cron/licitacoes`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://licitaai-next.vercel.app"}/api/cron/licitacoes-pncp`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    })
    if (!res.ok) {
      const text = await res.text()
      return { error: `Erro ${res.status}: ${text}` }
    }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
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

  const safeAssunto = escHtml(assunto)
  const safeMensagem = escHtml(mensagem)

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeAssunto}</title>
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
                    <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;font-weight:600;">${safeAssunto}</h2>
                    <div style="color:#cbd5e1;font-size:15px;line-height:1.6;white-space:pre-wrap;">${safeMensagem}</div>
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
    console.error("[enviarEmailAdmin] FROM_EMAIL:", FROM_EMAIL)
    console.error("[enviarEmailAdmin] API_KEY exists:", !!process.env.RESEND_API_KEY)
    const result = await resend.emails.send({
      from: "LicitaAI <onboarding@resend.dev>",
      to: userEmail,
      subject: assunto,
      html,
    })

    console.error("[enviarEmailAdmin] result:", JSON.stringify(result))

    if (result.error) {
      console.error("[enviarEmailAdmin] Resend error:", JSON.stringify(result.error))
      return { error: `Erro Resend: ${result.error.message ?? JSON.stringify(result.error)}` }
    }

    return { success: true }
  } catch (err) {
    console.error("[enviarEmailAdmin] exception:", err)
    return { error: `Erro inesperado: ${String(err)}` }
  }
}
