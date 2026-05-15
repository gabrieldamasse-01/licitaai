"use client"

import { Building2, Search, Clock, AlertTriangle, type LucideIcon } from "lucide-react"

interface MetricCard {
  key: string
  title: string
  description: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: string
}

const staggerClasses = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"]

export function MetricCards({ cards }: { cards: MetricCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map(({ key, title, description, icon: Icon, iconBg, iconColor, value }, i) => (
        <div
          key={key}
          className={`group relative overflow-hidden rounded-2xl p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.18)] hover:-translate-y-0.5 backdrop-blur-[4px] animate-fade-in-up ${staggerClasses[i] ?? ""}`}
          style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Glow on hover */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: "inset 0 0 40px rgba(59,130,246,0.06)" }} />

          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs md:text-sm font-medium text-slate-400">{title}</p>
              <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-110 ${iconBg}`}>
                <Icon className={`h-5 w-5 md:h-6 md:w-6 ${iconColor}`} />
              </div>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black tracking-tight text-white">
                {value}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate">{description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
