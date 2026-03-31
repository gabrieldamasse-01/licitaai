"use client"

import { useState } from "react"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarNav } from "@/components/app-sidebar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function MobileHeader({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Hamburger — visível só em mobile */}
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-700">
            <SheetHeader className="flex h-16 items-center border-b border-slate-700 px-6 py-0">
              <SheetTitle className="text-white text-lg font-bold tracking-tight">
                Licita<span className="text-blue-400">AI</span>
              </SheetTitle>
            </SheetHeader>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Logo — visível só em mobile quando sidebar está oculta */}
        <span className="text-base font-bold text-slate-900 md:hidden">
          Licita<span className="text-blue-600">AI</span>
        </span>
      </div>

      {/* Info do usuário */}
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-600 sm:block">{email}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-600 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  )
}
