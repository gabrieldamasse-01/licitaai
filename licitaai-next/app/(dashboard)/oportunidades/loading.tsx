export default function OportunidadesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-44 rounded-lg bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-100" />
      </div>

      {/* Seletor de empresa */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-4 w-32 rounded bg-slate-200 mb-3" />
        <div className="h-10 w-full rounded-md bg-slate-100" />
      </div>

      {/* Cards de oportunidades */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-6 w-16 rounded-full bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-2/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
