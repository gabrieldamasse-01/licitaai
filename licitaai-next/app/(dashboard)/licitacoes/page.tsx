import { Search } from "lucide-react"

export default function LicitacoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Licitações</h1>
        <p className="text-sm text-slate-500 mt-1">Editais monitorados do PNCP</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
        <Search className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">Esta seção está em desenvolvimento</p>
        <p className="text-xs text-slate-400 mt-1">Em breve disponível</p>
      </div>
    </div>
  )
}
