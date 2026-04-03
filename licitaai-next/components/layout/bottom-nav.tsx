"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Search, Target, FileText } from "lucide-react"

const navItems = [
  { label: "Início",       href: "/dashboard",    icon: LayoutDashboard },
  { label: "Licitações",   href: "/licitacoes",   icon: Search },
  { label: "Oportunidades",href: "/oportunidades",icon: Target },
  { label: "Documentos",   href: "/documentos",   icon: FileText },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-md border-t border-slate-200/80 pb-[env(safe-area-inset-bottom)] flex items-stretch h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(10)
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all relative min-h-[44px] ${
              isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {/* Active indicator — pill on top */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-full" />
            )}

            {/* Icon with bg when active */}
            <span className={`flex items-center justify-center w-9 h-7 rounded-lg transition-all ${
              isActive ? "bg-blue-50" : ""
            }`}>
              <Icon className={`w-[18px] h-[18px] ${isActive ? "stroke-[2.2px]" : "stroke-[1.6px]"}`} />
            </span>

            <span className={`text-[10px] font-medium tracking-wide leading-none ${
              isActive ? "font-semibold" : ""
            }`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
