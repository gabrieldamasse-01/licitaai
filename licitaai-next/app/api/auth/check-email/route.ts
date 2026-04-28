import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ exists: false })
  }

  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })

  if (error) {
    return NextResponse.json({ exists: false }, { status: 500 })
  }

  const exists = data.users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase().trim(),
  )

  return NextResponse.json({ exists })
}
