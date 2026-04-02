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
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-32 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="h-4 w-24 rounded-full bg-slate-200" />
                <div className="h-8 w-20 rounded-md bg-slate-200" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-64">
        <div className="h-4 w-40 rounded-full bg-slate-200 mb-8" />
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
