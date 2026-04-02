export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-100" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-28"
          >
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-8 w-16 rounded bg-slate-200" />
                <div className="h-2 w-20 rounded bg-slate-100" />
              </div>
              <div className="h-11 w-11 rounded-full bg-slate-200 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-64">
        <div className="h-4 w-40 rounded bg-slate-200 mb-6" />
        <div className="flex items-end gap-4 h-36">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-slate-200"
              style={{ height: `${40 + i * 10}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
