"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  FileText,
  Search,
  Target,
  BarChart3,
  Settings,
  Scale,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-100",
        isActive
          ? "bg-blue-600 text-white"
          : "text-slate-400 hover:bg-slate-700 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col px-3 py-4">
      <div className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="my-3 border-t border-slate-700/50" />

      <div className="flex flex-col gap-0.5">
        {secondaryNav.map((item) => (
          <NavItem key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  )
}

export function AppSidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-white tracking-tight">LicitaAI</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Plataforma de Licitações</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 px-5 py-3">
        <p className="text-[11px] text-slate-500">v1.0 · PNCP</p>
      </div>
    </aside>
  )
}
