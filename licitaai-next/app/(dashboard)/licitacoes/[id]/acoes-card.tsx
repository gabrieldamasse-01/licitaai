"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ExternalLink, Bookmark, Loader2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { salvarMatchDetalhe } from "../actions"

type Empresa = { id: string; razao_social: string }

interface AcoesCardProps {
  licitacaoId: string
  sourceUrl: string | null
  status: string
  empresas: Empresa[]
  jaSalvasPorEmpresa: Set<string>
}

export function AcoesCard({
  licitacaoId,
  sourceUrl,
  status,
  empresas,
  jaSalvasPorEmpresa,
}: AcoesCardProps) {
  const [empresaId, setEmpresaId] = useState<string>(
    empresas.length === 1 ? empresas[0].id : ""
  )
  const [salvas, setSalvas] = useState<Set<string>>(jaSalvasPorEmpresa)
  const [isPending, startTransition] = useTransition()

  const ativa = status === "ativa"

  function handleSalvar() {
    if (!empresaId) {
      toast.error("Selecione uma empresa para salvar a oportunidade.")
      return
    }
    startTransition(async () => {
      const result = await salvarMatchDetalhe(licitacaoId, empresaId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Oportunidade salva com sucesso!")
        setSalvas((prev) => new Set(prev).add(empresaId))
      }
    })
  }

  const jaSalva = salvas.has(empresaId)

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-5 sticky top-6">
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Status
        </span>
        <Badge
          variant="outline"
          className={
            ativa
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
              : "bg-rose-950/60 text-rose-300 border-rose-800/50"
          }
        >
          {ativa ? "Ativa" : "Encerrada"}
        </Badge>
      </div>

      {/* Ver Edital */}
      <Button
        asChild
        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        disabled={!sourceUrl}
      >
        <a
          href={sourceUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
          Ver Edital Original
        </a>
      </Button>

      <div className="border-t border-slate-700 pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Salvar como oportunidade
        </p>

        {empresas.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhuma empresa cadastrada.{" "}
            <a href="/clientes" className="text-blue-400 hover:underline">
              Cadastre uma empresa
            </a>{" "}
            para salvar esta oportunidade.
          </p>
        ) : (
          <>
            {empresas.length > 1 && (
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-200 text-sm h-9">
                  <SelectValue placeholder="Selecionar empresa..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {empresas.map((e) => (
                    <SelectItem
                      key={e.id}
                      value={e.id}
                      className="text-slate-200 focus:bg-slate-800 focus:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        {e.razao_social}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {empresas.length === 1 && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">{empresas[0].razao_social}</span>
              </div>
            )}

            <Button
              className="w-full gap-2 bg-slate-700 hover:bg-slate-600 text-white"
              onClick={handleSalvar}
              disabled={isPending || jaSalva || !empresaId}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : jaSalva ? (
                <>
                  <Bookmark className="h-4 w-4 fill-current" />
                  Salva
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  Salvar Oportunidade
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
