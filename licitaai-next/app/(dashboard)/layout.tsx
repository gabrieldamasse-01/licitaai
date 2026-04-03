import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BottomNav } from "@/components/layout/bottom-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Redirecionar para onboarding se não tiver empresa cadastrada
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!company) {
    redirect("/onboarding")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:shrink-0">
        <AppSidebar email={user.email ?? ""} />
      </div>

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <MobileHeader email={user.email ?? ""} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
