import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar, SidebarNav } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"

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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:shrink-0">
        <AppSidebar />
      </div>

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader email={user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
