"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CheckCircle2,
  Pencil,
  ExternalLink,
  RefreshCw,
  Building2,
  MapPin,
  DollarSign,
  Tag,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { aprovarPerfil, type LicitacaoRanking } from "./actions"

type Criterios = {
  cnaes: string[]
  palavras_chave: string[]
  ufs: string[]
  faixa_valor_min: number | null
  faixa_valor_max: number | null
  modalidades: string[]
}

type Props = {
  companyId: string
  licitacoes: LicitacaoRanking[]
  criteriosIniciais: Criterios
}

function formatCurrency(value: number | null): string {
  if (!value) return "Não informado"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}%
    </span>
  )
}

type EditableListProps = {
  label: string
  icon: React.ReactNode
  items: string[]
  onSave: (items: string[]) => void
}

function EditableList({ label, icon, items, onSave }: EditableListProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(items.join(", "))

  function handleSave() {
    const parsed = draft.split(",").map((s) => s.trim()).filter(Boolean)
    onSave(parsed)
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          {icon}
          {label}
        </div>
        <button
          onClick={() => { setEditing(!editing); setDraft(items.join(", ")) }}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Separe por vírgulas"
            className="bg-slate-700 border-slate-600 text-slate-100 text-sm h-9"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs text-slate-400">
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.length > 0 ? items.map((item) => (
            <Badge key={item} variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
              {item}
            </Badge>
          )) : (
            <span className="text-xs text-slate-500">Nenhum item definido</span>
          )}
        </div>
      )}
    </div>
  )
}

export function ValidarPerfilClient({ companyId, licitacoes, criteriosIniciais }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [criterios, setCriterios] = useState<Criterios>(criteriosIniciais)

  function updateCriterio<K extends keyof Criterios>(key: K, value: Criterios[K]) {
    setCriterios((prev) => ({ ...prev, [key]: value }))
  }

  function handleAprovar() {
    startTransition(async () => {
      const result = await aprovarPerfil(companyId, criterios)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/40 mx-auto">
            <span className="text-xl font-black text-white">L</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Valide seu perfil de licitações</h1>
          <p className="text-slate-400 text-sm">Confira os critérios identificados e as licitações encontradas para você.</p>
        </div>

        {/* Seção 1: Critérios de busca */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-400" />
            Seus critérios de busca
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <EditableList
              label="CNAEs identificados"
              icon={<Hash className="h-3.5 w-3.5 text-blue-400" />}
              items={criterios.cnaes}
              onSave={(v) => updateCriterio("cnaes", v)}
            />
            <EditableList
              label="Palavras-chave"
              icon={<Tag className="h-3.5 w-3.5 text-blue-400" />}
              items={criterios.palavras_chave}
              onSave={(v) => updateCriterio("palavras_chave", v)}
            />
            <EditableList
              label="Estados (UFs)"
              icon={<MapPin className="h-3.5 w-3.5 text-blue-400" />}
              items={criterios.ufs}
              onSave={(v) => updateCriterio("ufs", v)}
            />
            <EditableList
              label="Modalidades"
              icon={<Building2 className="h-3.5 w-3.5 text-blue-400" />}
              items={criterios.modalidades}
              onSave={(v) => updateCriterio("modalidades", v)}
            />
          </div>

          {/* Faixa de valor */}
          <div className="rounded-xl border border-blue-500/30 bg-slate-800/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
              <DollarSign className="h-3.5 w-3.5 text-blue-400" />
              Faixa de valor estimado
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Mínimo (R$)</label>
                <Input
                  type="number"
                  value={criterios.faixa_valor_min ?? ""}
                  onChange={(e) => updateCriterio("faixa_valor_min", e.target.value ? Number(e.target.value) : null)}
                  placeholder="Sem mínimo"
                  className="bg-slate-700 border-slate-600 text-slate-100 text-sm h-9"
                />
              </div>
              <span className="text-slate-500 text-sm mt-5">até</span>
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Máximo (R$)</label>
                <Input
                  type="number"
                  value={criterios.faixa_valor_max ?? ""}
                  onChange={(e) => updateCriterio("faixa_valor_max", e.target.value ? Number(e.target.value) : null)}
                  placeholder="Sem máximo"
                  className="bg-slate-700 border-slate-600 text-slate-100 text-sm h-9"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Ranking preliminar */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            Licitações identificadas para você
            <Badge className="bg-blue-600/30 text-blue-300 border-blue-500/30 text-xs ml-1">
              {licitacoes.length} encontradas
            </Badge>
          </h2>

          {licitacoes.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-8 text-center">
              <p className="text-slate-400 text-sm">Nenhuma licitação com score ≥ 70 encontrada nos últimos 7 dias.</p>
              <p className="text-slate-500 text-xs mt-1">Novos editais são sincronizados diariamente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {licitacoes.map((lic) => (
                <div key={lic.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ScoreBadge score={lic.score} />
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-600 text-slate-400"
                        >
                          {lic.motivo.startsWith("CNAE") ? "Match por CNAE" : "Match por palavra-chave"}
                        </Badge>
                        {lic.uf && (
                          <span className="text-xs text-slate-500 flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {lic.uf}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-2 leading-snug">
                        {lic.objeto}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {lic.orgao && <span>{lic.orgao}</span>}
                        {lic.valor_estimado && (
                          <span className="text-green-400 font-medium">
                            {formatCurrency(lic.valor_estimado)}
                          </span>
                        )}
                        {lic.data_encerramento && (
                          <span>
                            Encerra: {new Date(lic.data_encerramento).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                    {lic.source_url && (
                      <a
                        href={lic.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver detalhes
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seção 3: Ações */}
        <section className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button
            onClick={handleAprovar}
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-base font-semibold"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {isPending ? "Salvando..." : "Aprovar perfil e ir para o Dashboard"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/onboarding")}
            disabled={isPending}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 h-11"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refazer cadastro
          </Button>
        </section>
      </div>
    </div>
  )
}
