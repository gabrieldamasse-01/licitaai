import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createHash, randomInt } from "crypto"
import nodemailer from "nodemailer"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  // Gera código de 6 dígitos
  const code = String(randomInt(100000, 999999))
  const codeHash = createHash("sha256").update(code).digest("hex")
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

  // Remove OTPs anteriores não usados do usuário
  await service.from("otp_codes").delete().eq("user_id", user.id).eq("used", false)

  // Salva o novo OTP
  const { error: insertError } = await service.from("otp_codes").insert({
    user_id: user.id,
    code_hash: codeHash,
    expires_at: expiresAt.toISOString(),
  })

  if (insertError) {
    return NextResponse.json({ error: "Erro ao gerar código" }, { status: 500 })
  }

  // Envia via Gmail SMTP (funciona para qualquer destinatário sem domínio verificado)
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"LicitaAI" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: "Seu código de verificação — LicitaAI",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1e293b">Verificação em duas etapas</h2>
          <p style="color:#475569">Use o código abaixo para concluir o login. Ele expira em <strong>10 minutos</strong>.</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af">${code}</span>
          </div>
          <p style="color:#64748b;font-size:13px">Se você não tentou fazer login, ignore este e-mail e sua conta permanecerá segura.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[send-otp] Gmail SMTP error:", err)
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  // Cookie que indica 2FA pendente — middleware bloqueia acesso até verificação
  response.cookies.set("2fa_pending", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60, // 10 minutos (mesmo tempo do OTP)
    path: "/",
  })
  return response
}
