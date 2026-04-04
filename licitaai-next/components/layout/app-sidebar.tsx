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
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const mainNav = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard, iconColor: "text-blue-400" },
  { href: "/clientes",     label: "Clientes",     icon: Building2,       iconColor: "text-indigo-400" },
  { href: "/documentos",   label: "Documentos",   icon: FileText,        iconColor: "text-amber-400" },
  { href: "/licitacoes",   label: "Licitações",   icon: Search,          iconColor: "text-emerald-400" },
  { href: "/oportunidades",label: "Oportunidades",icon: Target,          iconColor: "text-violet-400" },
  { href: "/relatorios",   label: "Relatórios",   icon: BarChart3,       iconColor: "text-cyan-400" },
]

const secondaryNav = [
  { href: "/feedback",     label: "Feedback",      icon: MessageSquare, iconColor: "text-violet-400" },
  { href: "/configuracoes", label: "Configurações", icon: Settings,      iconColor: "text-slate-400" },
]

function NavItem({
  href,
  label,
  icon: Icon,
  iconColor,
  onNavigate,
}: {
  href: string
  label: string
  icon: React.ElementType
  iconColor: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px]",
        isActive
          ? "[background:rgba(37,99,235,0.18)] text-blue-300 border-l-2 border-blue-400/60 pl-[10px] backdrop-blur-sm shadow-[inset_0_0_12px_rgba(37,99,235,0.15)]"
          : "text-slate-400 hover:bg-white/[0.07] hover:text-white border-l-2 border-transparent pl-[10px]"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-blue-300" : `${iconColor} group-hover:brightness-125`
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
    <aside className="flex h-full w-64 flex-col bg-[#0A1628] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 shrink-0 border-b border-white/[0.06]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-900/40">
          <Scale className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-white tracking-tight">
            Licita<span className="text-blue-400">AI</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium">
            Plataforma de Licitações
          </p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5">
        <div className="px-2 py-1.5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">
            Menu
          </p>
        </div>

        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} onNavigate={onNavigate} />
        ))}

        {/* Separador */}
        <div className="my-2 mx-4 border-t border-white/[0.06]" />

        {secondaryNav.map((item) => (
          <NavItem key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Versão + badge beta */}
      <div className="px-5 py-2 shrink-0 flex items-center gap-2">
        <p className="text-[10px] text-slate-600 font-medium tracking-wide">
          v1.0 · Integração PNCP
        </p>
        <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-400">
          Beta
        </span>
      </div>

      {/* Footer / Usuário */}
      <div className="border-t border-white/[0.06] p-3 shrink-0">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-[13px] font-bold text-white shadow">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{firstName}</p>
              <p className="text-[11px] text-slate-500 truncate leading-tight">{email || "usuario@licitai.com.br"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
