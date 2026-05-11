import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/is-admin"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { NotificationsBell } from "@/components/notifications-bell"
import { GlobalSearch } from "@/components/global-search"
import { ImpersonationBanner } from "@/components/impersonation-banner"
import { getImpersonationContext } from "@/lib/impersonation"
import { OnboardingTour } from "@/components/onboarding-tour"
import { PwaRegister } from "@/components/pwa-register"

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

  // Verifica permissão admin e impersonação em paralelo
  const [adminOk, { impersonatingUserId, impersonatedEmail }] = await Promise.all([
    isAdmin(),
    getImpersonationContext(),
  ])

  // Redirecionar para onboarding se não tiver empresa cadastrada
  // (pula o check quando impersonando — admin acessa o dashboard do cliente)
  if (!impersonatingUserId) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    if (!company) {
      redirect("/onboarding")
    }
  }

  const isImpersonating = !!impersonatingUserId && !!impersonatedEmail

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:shrink-0">
        <AppSidebar email={user.email ?? ""} isAdmin={adminOk} />
      </div>

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header desktop */}
        <div className="hidden md:flex h-12 shrink-0 items-center justify-end gap-1 border-b border-white/5 bg-slate-900 px-6">
          <GlobalSearch />
          <NotificationsBell userId={user.id} />
        </div>
        <MobileHeader email={user.email ?? ""} userId={user.id} />

        {/* Banner: impersonação OU beta */}
        {isImpersonating ? (
          <ImpersonationBanner email={impersonatedEmail!} />
        ) : (
          <div className="shrink-0 px-4 py-2 flex items-center justify-center gap-3 backdrop-blur-sm border-b" style={{ background: "rgba(37,99,235,0.08)", borderColor: "rgba(59,130,246,0.15)" }}>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Beta
            </span>
            <p className="text-xs text-slate-400">
              Você está usando uma versão beta do LicitaAI.{" "}
              <Link href="/feedback" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                Envie seu feedback
              </Link>
            </p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-900 p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
          {children}
        </main>
        <OnboardingTour />
        <PwaRegister />
        <BottomNav />
      </div>
    </div>
  )
}
