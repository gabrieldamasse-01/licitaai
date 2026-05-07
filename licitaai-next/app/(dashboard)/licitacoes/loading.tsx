export default function LicitacoesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-40 rounded-lg bg-slate-700/60" />
        <div className="h-4 w-56 rounded bg-slate-700/60" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar filtros */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 shadow-sm space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-slate-700/60" />
                <div className="h-9 w-full rounded-md bg-slate-700/60" />
              </div>
            ))}
          </div>
        </aside>

        {/* Cards */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
              <div className="flex gap-2">
                <div className="h-5 w-10 rounded-full bg-slate-700/60" />
                <div className="h-5 w-28 rounded-full bg-slate-700/60" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-700/60 rounded w-full" />
                <div className="h-4 bg-slate-700/60 rounded w-4/5" />
              </div>
              <div className="h-3 bg-slate-700/60 rounded w-3/5" />
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <div className="space-y-1.5">
                  <div className="h-4 bg-slate-700/60 rounded w-28" />
                  <div className="h-3 bg-slate-700/60 rounded w-20" />
                </div>
                <div className="h-8 w-28 bg-slate-700/60 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
