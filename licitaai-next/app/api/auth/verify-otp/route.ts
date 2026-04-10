import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createHash } from "crypto"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body = await req.json() as { code?: string }
  const code = String(body.code ?? "").trim()

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 })
  }

  const codeHash = createHash("sha256").update(code).digest("hex")
  const service = createServiceClient()

  // Busca OTP válido (não usado, não expirado)
  const { data: otp } = await service
    .from("otp_codes")
    .select("id, expires_at, used")
    .eq("user_id", user.id)
    .eq("code_hash", codeHash)
    .eq("used", false)
    .single()

  if (!otp) {
    return NextResponse.json({ error: "Código incorreto ou expirado" }, { status: 400 })
  }

  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: "Código expirado" }, { status: 400 })
  }

  // Marca como usado
  await service.from("otp_codes").update({ used: true }).eq("id", otp.id)

  const response = NextResponse.json({ ok: true })
  // Remove cookie pendente e marca sessão como verificada
  response.cookies.delete("2fa_pending")
  response.cookies.set("2fa_verified", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 horas
    path: "/",
  })

  return response
}
