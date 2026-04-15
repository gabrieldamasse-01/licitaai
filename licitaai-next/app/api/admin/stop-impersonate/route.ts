import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/is-admin"

export async function POST() {
  const adminOk = await isAdmin()
  if (!adminOk) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const response = NextResponse.json({ success: true })
  response.cookies.set("impersonating_user_id", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  })
  return response
}
