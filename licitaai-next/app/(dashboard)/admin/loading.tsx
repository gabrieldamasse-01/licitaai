export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-8 w-44 rounded-lg bg-slate-700/60" />
        <div className="h-4 w-64 rounded bg-slate-700/60" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-t-lg bg-slate-700/60" />
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-700/60" />
              <div className="h-8 w-8 rounded-lg bg-slate-700/60" />
            </div>
            <div className="h-8 w-16 rounded bg-slate-700/60" />
            <div className="h-3 w-28 rounded bg-slate-700/60" />
          </div>
        ))}
      </div>

      {/* Tabela clientes */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="h-5 w-32 rounded bg-slate-700/60" />
          <div className="h-9 w-48 rounded-lg bg-slate-700/60" />
        </div>
        <div className="flex gap-4 px-5 py-3 border-b border-slate-700">
          <div className="h-4 w-48 rounded bg-slate-700/60" />
          <div className="h-4 w-40 rounded bg-slate-700/60" />
          <div className="h-4 w-24 rounded bg-slate-700/60 ml-auto" />
          <div className="h-4 w-20 rounded bg-slate-700/60" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-slate-700/50 items-center">
            <div className="h-4 w-48 rounded bg-slate-700/60" />
            <div className="h-4 w-40 rounded bg-slate-700/60" />
            <div className="h-4 w-24 rounded bg-slate-700/60 ml-auto" />
            <div className="h-6 w-20 rounded-full bg-slate-700/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
