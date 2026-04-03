export default function OportunidadesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-44 rounded-lg bg-slate-700" />
        <div className="h-4 w-72 rounded bg-slate-700" />
      </div>

      {/* Seletor de empresa */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="h-4 w-32 rounded bg-slate-700 mb-3" />
        <div className="h-10 w-full rounded-md bg-slate-700" />
      </div>

      {/* Cards de oportunidades */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-6 w-16 rounded-full bg-slate-700" />
              <div className="h-4 w-24 rounded bg-slate-700" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-3/4" />
            </div>
            <div className="h-3 bg-slate-700 rounded w-2/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
