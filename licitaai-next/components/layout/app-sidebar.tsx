"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  FileText,
  Search,
  Target,
  BarChart3,
  Settings,
  Scale,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/licitacoes", label: "Licitações", icon: Search },
  { href: "/oportunidades", label: "Oportunidades", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
]

const secondaryNav = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

function NavItem({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string
  label: string
  icon: React.ElementType
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 min-h-[44px]",
        isActive
          ? "border-l-2 border-blue-400 bg-blue-500/10 text-white"
          : "border-l-2 border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  )
}

function getFirstName(email: string): string {
  if (!email) return "Usuário"
  const local = email.split("@")[0]
  const part = local.split(/[._-]/)[0]
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

function getInitial(email: string): string {
  if (!email) return "U"
  return getFirstName(email).charAt(0).toUpperCase()
}

export function AppSidebar({ email = "", onNavigate }: { email?: string; onNavigate?: () => void }) {
  const router = useRouter()
  const firstName = getFirstName(email)
  const initial = getInitial(email)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0A1628] border-r border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <Scale className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-white tracking-tight">Licita<span className="text-blue-400">IA</span></p>
          <p className="text-[11px] text-slate-400 mt-0.5">Plataforma de Licitações</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col">
        <div className="flex flex-col">
          {mainNav.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="my-4 border-t border-white/5 mx-4" />

        <div className="flex flex-col">
          {secondaryNav.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="px-5 py-3 shrink-0">
        <p className="text-[11px] text-slate-500 font-medium tracking-wide">v1.0 · Integração PNCP</p>
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-white/5 p-4 shrink-0 bg-[#050D1A]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sm font-bold text-blue-400">
              {initial}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{firstName}</p>
              <p className="text-xs text-slate-400 truncate">{email || "usuario@licitaia.com.br"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 ml-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
