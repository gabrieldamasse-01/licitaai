"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCircle,
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
  { href: "/perfil",        label: "Meu Perfil",    icon: UserCircle,    iconColor: "text-blue-400" },
  { href: "/feedback",      label: "Feedback",      icon: MessageSquare, iconColor: "text-violet-400" },
  { href: "/configuracoes", label: "Configurações", icon: Settings,      iconColor: "text-slate-400" },
]

function NavItem({
  href,
  label,
  icon: Icon,
  iconColor,
  collapsed,
  onNavigate,
}: {
  href: string
  label: string
  icon: React.ElementType
  iconColor: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center mx-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]",
        collapsed ? "justify-center px-0" : "gap-3 px-3 pl-[10px]",
        isActive
          ? "bg-gradient-to-r from-blue-600/20 to-violet-600/10 text-blue-300 border-l-2 border-blue-500 backdrop-blur-sm shadow-[inset_0_0_12px_rgba(37,99,235,0.15)]"
          : "text-slate-400 hover:bg-white/[0.07] hover:text-white border-l-2 border-transparent"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-all duration-200",
          isActive ? "text-blue-300" : `${iconColor} group-hover:brightness-125 group-hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]`
        )}
      />
      {!collapsed && <span className="truncate font-medium">{label}</span>}
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

export function AppSidebar({ email = "", isAdmin = false, onNavigate }: { email?: string; isAdmin?: boolean; onNavigate?: () => void }) {
  const router = useRouter()
  const firstName = getFirstName(email)
  const initial = getInitial(email)

  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) setCollapsed(saved === "true")
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("sidebar-collapsed", String(next))
      return next
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-[#0A1628] border-r border-white/[0.06] transition-all duration-200",
        collapsed ? "w-[60px]" : "w-64"
      )}
    >
      {/* Logo + toggle */}
      <div className={cn(
        "flex h-16 shrink-0 border-b border-white/[0.06]",
        collapsed ? "flex-col items-center justify-center gap-1.5" : "items-center gap-2 px-3"
      )}>
        {collapsed ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-md shadow-blue-900/30">
            <Scale className="h-3.5 w-3.5 text-white" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-900/40">
                <Scale className="h-4 w-4 text-white" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-[15px] font-bold text-white tracking-tight">
                  Licita<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">AI</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium">
                  Plataforma de Licitações
                </p>
              </div>
            </div>
            <button
              onClick={toggleCollapsed}
              title="Recolher sidebar"
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border border-white/20 text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="size-3" />
            </button>
          </>
        )}
      </div>

      {/* Nav principal */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5">
        {collapsed && (
          <div className="flex justify-center mb-1">
            <button
              onClick={toggleCollapsed}
              title="Expandir sidebar"
              className="flex h-[18px] w-[18px] items-center justify-center rounded-sm border border-white/20 text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="size-3" />
            </button>
          </div>
        )}
        {!collapsed && (
          <div className="px-2 py-1.5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">
              Menu
            </p>
          </div>
        )}

        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}

        {/* Separador */}
        <div className={cn("my-2 border-t border-white/[0.06]", collapsed ? "mx-2" : "mx-4")} />

        {secondaryNav.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}

        {isAdmin && (
          <NavItem
            href="/admin"
            label="Admin"
            icon={Shield}
            iconColor="text-red-400"
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      {/* Versão + badge beta */}
      {!collapsed && (
        <div className="px-5 py-2 shrink-0 flex items-center gap-2">
          <p className="text-[10px] text-slate-600 font-medium tracking-wide">
            v1.0
          </p>
          <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-400">
            Beta
          </span>
        </div>
      )}

      {/* Footer / Usuário */}
      <div className="border-t border-white/[0.06] p-3 shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/perfil"
              title="Meu Perfil"
              onClick={onNavigate}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-[13px] font-bold text-white shadow hover:shadow-md hover:scale-105 transition-all"
            >
              {initial}
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <Link
              href="/perfil"
              onClick={onNavigate}
              className="flex items-center gap-3 min-w-0 group"
              title="Meu Perfil"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-[13px] font-bold text-white shadow group-hover:shadow-md group-hover:scale-105 transition-all">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight group-hover:text-blue-300 transition-colors">{firstName}</p>
                <p className="text-[11px] text-slate-500 truncate leading-tight">{email || "usuario@licitai.com.br"}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
