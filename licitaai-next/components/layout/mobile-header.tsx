"use client"

import { useState } from "react"
import { LogOut, Scale, ChevronDown } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { NotificationsBell } from "@/components/notifications-bell"
import { GlobalSearch } from "@/components/global-search"

function getFirstName(email: string): string {
  const local = email.split("@")[0]
  const part = local.split(/[._-]/)[0]
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

function getInitial(email: string): string {
  return getFirstName(email).charAt(0).toUpperCase()
}

export function MobileHeader({ email, userId }: { email: string; userId: string }) {
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0A1628] px-4 md:px-6 z-30 sticky top-0 md:hidden">
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.35)]">
          <Scale className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-bold text-white tracking-tight">Licita<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">AI</span></span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <GlobalSearch />
        <NotificationsBell userId={userId} />

      {/* User profile popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 focus:outline-none rounded-full focus-visible:ring-2 focus-visible:ring-blue-500 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-sm font-bold text-blue-600 select-none">
              {initial}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="bottom" sideOffset={8} className="min-w-[200px] w-auto max-w-[calc(100vw-32px)] p-2 rounded-xl z-50">
          <div className="p-2 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{firstName}</p>
            <p className="text-xs text-slate-500 truncate leading-snug">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-start gap-2 py-2 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sair da plataforma
          </button>
        </PopoverContent>
      </Popover>
      </div>
    </header>
  )
}
