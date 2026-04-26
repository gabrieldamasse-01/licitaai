import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

            <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0">
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">O que você pode fazer agora</p>
              <ul style="margin:0;padding:0 0 0 20px;color:#334155;font-size:14px;line-height:2">
                <li>Ver suas <strong>oportunidades</strong> de licitação</li>
                <li>Cadastrar seus <strong>documentos</strong> de habilitação</li>
                <li>Acompanhar vencimentos e receber <strong>alertas por e-mail</strong></li>
                <li>Analisar editais com <strong>Inteligência Artificial</strong></li>
              </ul>
            </div>

            <div style="text-align:center;margin:32px 0">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://licitaai-next.vercel.app"}/oportunidades"
                style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#06b6d4);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px">
                Ver Minhas Oportunidades →
              </a>
            </div>

            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
              Estamos em fase <strong>beta</strong> — sua opinião é muito importante para nós!
              Se tiver sugestões ou encontrar algum problema, acesse a página de
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://licitaai-next.vercel.app"}/feedback" style="color:#2563eb">Feedback</a>.
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
