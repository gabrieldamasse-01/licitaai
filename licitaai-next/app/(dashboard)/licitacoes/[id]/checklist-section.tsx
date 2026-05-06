"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChecklistHabilitacaoLicitacao } from "./checklist-habilitacao"
import { ClipboardList } from "lucide-react"

type Empresa = { id: string; razao_social: string; cnae: string[] | null }

export function ChecklistSection({
  licitacaoId,
  sourceUrl,
  empresas,
}: {
  licitacaoId: string
  sourceUrl: string | null
  empresas: Empresa[]
}) {
  const [empresaId, setEmpresaId] = useState<string>(empresas[0]?.id ?? "")

  const empresa = empresas.find((e) => e.id === empresaId)

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-slate-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Checklist de Habilitação Completo
        </p>
      </div>

      {empresas.length > 1 && (
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="w-full sm:w-72 bg-slate-900 border-slate-600 text-white">
            <SelectValue placeholder="Selecione a empresa..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id} className="text-white focus:bg-slate-700">
                {e.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <ChecklistHabilitacaoLicitacao
        licitacaoId={licitacaoId}
        sourceUrl={sourceUrl}
        empresaId={empresaId || null}
        empresaCnaes={empresa?.cnae ?? []}
      />
    </div>
  )
}
