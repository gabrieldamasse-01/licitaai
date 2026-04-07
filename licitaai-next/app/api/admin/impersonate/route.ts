import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/is-admin"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: NextRequest) {
  // Apenas admins podem impersonar
  const adminOk = await isAdmin()
  if (!adminOk) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  let body: { user_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { user_id } = body
  if (!user_id || typeof user_id !== "string") {
    return NextResponse.json({ error: "user_id inválido" }, { status: 400 })
  }

  // Verifica que o user_id existe na plataforma
  const service = createServiceClient()
  const { data: { user }, error } = await service.auth.admin.getUserById(user_id)
  if (error || !user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const response = NextResponse.json({ success: true, email: user.email })
  response.cookies.set("impersonating_user_id", user_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hora
    path: "/",
  })
  return response
}
