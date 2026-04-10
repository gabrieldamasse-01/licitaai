import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ twoFactorEnabled: false })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("user_preferences")
    .select("two_factor_enabled")
    .eq("user_id", user.id)
    .single()

  return NextResponse.json({ twoFactorEnabled: data?.two_factor_enabled ?? false })
}
