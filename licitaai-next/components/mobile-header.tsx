"use client"

import { useState } from "react"
import { Menu, LogOut, Scale } from "lucide-react"
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

function getFirstName(email: string): string {
  const local = email.split("@")[0]
  const part = local.split(/[._-]/)[0]
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

function getInitial(email: string): string {
  return getFirstName(email).charAt(0).toUpperCase()
}

export function MobileHeader({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const firstName = getFirstName(email)
  const initial = getInitial(email)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
      {/* Esquerda: hamburguer + logo mobile */}
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-500 hover:text-slate-900"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-700">
            <SheetHeader className="flex h-16 flex-row items-center gap-3 border-b border-slate-700/50 px-5 py-0 space-y-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <SheetTitle className="text-[15px] font-bold text-white tracking-tight leading-none">
                  LicitaAI
                </SheetTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">Plataforma de Licitações</p>
              </div>
            </SheetHeader>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Logo compacto — mobile only */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
            <Scale className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">LicitaAI</span>
        </div>
      </div>

      {/* Direita: avatar + nome + logout */}
      <div className="flex items-center gap-3">
        {/* Avatar + nome */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white select-none">
            {initial}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-slate-800 leading-none">{firstName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Administrador</p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-1.5 hidden sm:inline text-sm">Sair</span>
        </Button>
      </div>
    </header>
  )
}
