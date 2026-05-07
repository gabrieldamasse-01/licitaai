import React from "react"

export default function DashboardPageLoading() {
  return (
    <div className="space-y-8 animate-pulse" style={{ '--tw-animate-duration': '1.5s' } as React.CSSProperties}>
      <div className="space-y-2">
        <div className="h-8 w-36 rounded-lg bg-slate-700/60" />
        <div className="h-4 w-52 rounded bg-slate-700/60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 shadow-sm h-28">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 rounded bg-slate-700/60" />
                <div className="h-8 w-16 rounded bg-slate-700/60" />
              </div>
              <div className="h-11 w-11 rounded-full bg-slate-700/60 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-6 shadow-sm h-56">
        <div className="h-4 w-40 rounded bg-slate-700/60 mb-6" />
        <div className="flex items-end gap-4 h-32">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t bg-slate-700/60" style={{ height: `${30 + i * 12}%` }} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/60 p-6 shadow-sm space-y-4">
            <div className="h-4 w-40 rounded bg-slate-700/60" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between py-2 border-t border-slate-700">
                <div className="space-y-1.5">
                  <div className="h-4 bg-slate-700/60 rounded w-48" />
                  <div className="h-3 bg-slate-700/60 rounded w-32" />
                </div>
                <div className="h-5 w-16 rounded-full bg-slate-700/60" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
