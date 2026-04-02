"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Search, Target, FileText } from "lucide-react"

const navItems = [
  {
    label: "Início",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Licitações",
    href: "/licitacoes",
    icon: Search,
  },
  {
    label: "Oportunidades",
    href: "/oportunidades",
    icon: Target,
  },
  {
    label: "Documentos",
    href: "/documentos",
    icon: FileText,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] flex items-center justify-around h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10)
              }
            }}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative min-h-[44px] ${
              isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-md" />
            )}
            <Icon className={`w-5 h-5 mt-1 ${isActive ? "fill-blue-600/10" : ""}`} />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
