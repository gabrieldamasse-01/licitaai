import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { resend } from "@/lib/resend"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { razao_social } = await req.json()
    const email = user.email
    if (!email) return NextResponse.json({ error: "Email não disponível" }, { status: 400 })

    const firstName = email.split("@")[0].split(/[._-]/)[0]
    const nome = razao_social || firstName

    // Busca total de licitações ativas no sistema
    const service = createServiceClient()
    const { count: totalLicitacoes } = await service
      .from("licitacoes")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativa")
    const countLic = totalLicitacoes ?? 0

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://licitaai-next.vercel.app"

    const checklistHtml = [
      { label: "Cadastrar primeira empresa", href: `${appUrl}/clientes` },
      { label: "Completar entrevista de perfil", href: `${appUrl}/onboarding/entrevista` },
      { label: "Validar perfil de licitações", href: `${appUrl}/onboarding/validar-perfil` },
      { label: "Cadastrar documentos de habilitação", href: `${appUrl}/documentos` },
      { label: "Ver suas primeiras oportunidades", href: `${appUrl}/oportunidades` },
    ]
      .map(
        (item) =>
          `<li style="margin-bottom:10px;display:flex;align-items:center;gap:10px">
            <span style="display:inline-block;width:20px;height:20px;border-radius:50%;border:2px solid #cbd5e1;flex-shrink:0"></span>
            <a href="${item.href}" style="color:#2563eb;text-decoration:none;font-size:14px;font-weight:500">${item.label}</a>
          </li>`,
      )
      .join("")

    await resend.emails.send({
      from: "LicitaAI <onboarding@resend.dev>",
      to: email,
      subject: "Bem-vindo ao LicitaAI! 🎉",
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#06b6d4);padding:36px 40px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Licita<span style="color:#93c5fd">AI</span>
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;text-transform:uppercase;letter-spacing:2px">
              Plataforma de Licitações
            </div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a">
              Bem-vindo ao LicitaAI, ${nome}! 🎉
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7">
              Sua empresa foi cadastrada com sucesso. A partir de agora, o LicitaAI vai monitorar
              licitações públicas relevantes para o seu perfil e te avisar quando surgirem novas
              oportunidades.
            </p>

            ${
              countLic > 0
                ? `<div style="background:linear-gradient(135deg,#eff6ff,#e0f2fe);border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin:0 0 24px;text-align:center">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#1d4ed8">
                      🔍 ${countLic.toLocaleString("pt-BR")} licitações esperando por você
                    </p>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b">Licitações ativas no sistema agora mesmo</p>
                  </div>`
                : ""
            }

            <!-- Checklist -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:0 0 24px">
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px">
                ✅ Próximos passos para começar
              </p>
              <ul style="margin:0;padding:0;list-style:none">
                ${checklistHtml}
              </ul>
            </div>

            <div style="text-align:center;margin:32px 0">
              <a href="${appUrl}/onboarding/entrevista"
                style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#06b6d4);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px">
                Completar meu perfil →
              </a>
            </div>

            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
              Estamos em fase <strong>beta</strong> — sua opinião é muito importante para nós!
              Se tiver sugestões ou encontrar algum problema, acesse a página de
              <a href="${appUrl}/feedback" style="color:#2563eb">Feedback</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              © 2026 LicitaAI · alertas@licitaai.com.br
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `.trim(),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[email/boas-vindas]", err)
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 })
  }
}
