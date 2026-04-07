import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { NotificationsBell } from "@/components/notifications-bell"
import { GlobalSearch } from "@/components/global-search"

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
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:shrink-0">
        <AppSidebar email={user.email ?? ""} />
      </div>

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header desktop (oculto no mobile — MobileHeader cobre o mobile) */}
        <div className="hidden md:flex h-12 shrink-0 items-center justify-end gap-1 border-b border-slate-800/60 bg-slate-900 px-6">
          <GlobalSearch />
          <NotificationsBell userId={user.id} />
        </div>
        <MobileHeader email={user.email ?? ""} userId={user.id} />
        {/* Beta banner */}
        <div className="shrink-0 px-4 py-2 flex items-center justify-center gap-3 backdrop-blur-sm border-b" style={{ background: "rgba(109,40,217,0.15)", borderColor: "rgba(139,92,246,0.25)" }}>
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
            Beta
          </span>
          <p className="text-xs text-slate-400">
            Você está usando uma versão beta do LicitaAI.{" "}
            <Link href="/feedback" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
              Envie seu feedback
            </Link>
          </p>
        </div>
        <main className="flex-1 overflow-y-auto bg-slate-900 p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
