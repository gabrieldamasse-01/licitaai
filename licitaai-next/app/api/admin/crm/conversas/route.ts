import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/is-admin"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const adminOk = await isAdmin()
  if (!adminOk) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const leadId = searchParams.get("lead_id")

  if (!leadId) return NextResponse.json({ error: "lead_id obrigatório" }, { status: 400 })

  const supabase = createServiceClient()
  const { data: conversas } = await supabase
    .from("lead_conversas")
    .select("id, role, conteudo, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })

  return NextResponse.json({ conversas: conversas ?? [] })
}
