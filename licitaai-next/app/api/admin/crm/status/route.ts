import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/is-admin"
import { createServiceClient } from "@/lib/supabase/service"

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const adminOk = await isAdmin()
  if (!adminOk) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { lead_id, status } = await req.json()

  if (!lead_id || !status) {
    return NextResponse.json({ error: "lead_id e status são obrigatórios" }, { status: 400 })
  }

  const statusValidos = ["novo", "contactado", "interessado", "convertido", "perdido"]
  if (!statusValidos.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", lead_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
