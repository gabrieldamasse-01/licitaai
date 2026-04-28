"use client"

import { useState, useTransition, useMemo } from "react"
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
  SlidersHorizontal,
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

type Pesos = {
  cnae: number
  uf: number
  valor: number
  modalidade: number
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
  const color =
    score >= 85
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : score >= 70
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-slate-500/20 text-slate-400 border-slate-500/30"
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}%
    </span>
  )
}

const UFS_BRASIL = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]
const MODALIDADES_LISTA = ["Pregão Eletrônico","Dispensa","Concorrência","Tomada de Preços","Convite","Leilão","Credenciamento"]

type CheckboxListProps = {
  label: string
  icon: React.ReactNode
  opcoes: string[]
  selecionados: string[]
  onChange: (items: string[]) => void
}

function CheckboxList({ label, icon, opcoes, selecionados, onChange }: CheckboxListProps) {
  function toggle(item: string) {
    if (selecionados.includes(item)) {
      onChange(selecionados.filter((i) => i !== item))
    } else {
      onChange([...selecionados, item])
    }
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-slate-800/60 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((item) => {
          const sel = selecionados.includes(item)
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                sel
                  ? "bg-blue-600/30 text-blue-300 border-blue-500/50"
                  : "bg-slate-700 text-slate-400 border-slate-600 hover:text-slate-300"
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>
      {selecionados.length === 0 && (
        <p className="text-xs text-slate-500 mt-2">Nenhum selecionado (todos aceitos)</p>
      )}
    </div>
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

type SliderRowProps = {
  label: string
  value: number
  onChange: (v: number) => void
}

function SliderRow({ label, value, onChange }: SliderRowProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 shrink-0 text-sm text-slate-300">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-blue-500 h-1.5 rounded-full cursor-pointer"
      />
      <span className="w-10 text-right text-sm font-semibold text-white">{value}%</span>
    </div>
  )
}

function calcularScorePonderado(
  lic: LicitacaoRanking,
  criterios: Criterios,
  pesos: Pesos,
): number {
  const total = pesos.cnae + pesos.uf + pesos.valor + pesos.modalidade
  if (total === 0) return lic.score

  let pontos = 0

  // CNAE match — usa o score original como proxy do match de CNAE/keyword
  const cnaeMatch = lic.motivo.startsWith("CNAE") ? 1 : 0.5
  pontos += (pesos.cnae / total) * cnaeMatch * 100

  // UF prioritária
  const ufMatch = criterios.ufs.length === 0 || (lic.uf !== null && criterios.ufs.includes(lic.uf)) ? 1 : 0.3
  pontos += (pesos.uf / total) * ufMatch * 100

  // Faixa de valor
  let valorMatch = 1
  if (criterios.faixa_valor_min !== null && lic.valor_estimado !== null && lic.valor_estimado < criterios.faixa_valor_min) {
    valorMatch = 0.4
  } else if (criterios.faixa_valor_max !== null && lic.valor_estimado !== null && lic.valor_estimado > criterios.faixa_valor_max) {
    valorMatch = 0.4
  } else if (lic.valor_estimado === null) {
    valorMatch = 0.7
  }
  pontos += (pesos.valor / total) * valorMatch * 100

  // Modalidade preferida
  const modalMatch = criterios.modalidades.length === 0 || (lic.modalidade !== null && criterios.modalidades.includes(lic.modalidade)) ? 1 : 0.4
  pontos += (pesos.modalidade / total) * modalMatch * 100

  return Math.min(100, Math.round(pontos))
}

export function ValidarPerfilClient({ companyId, licitacoes, criteriosIniciais }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [criterios, setCriterios] = useState<Criterios>(criteriosIniciais)
  const [pesos, setPesos] = useState<Pesos>({ cnae: 40, uf: 20, valor: 20, modalidade: 20 })

  const totalPesos = pesos.cnae + pesos.uf + pesos.valor + pesos.modalidade

  function updatePeso(key: keyof Pesos, value: number) {
    setPesos((prev) => ({ ...prev, [key]: value }))
  }

  function updateCriterio<K extends keyof Criterios>(key: K, value: Criterios[K]) {
    setCriterios((prev) => ({ ...prev, [key]: value }))
  }

  const licitacoesRanqueadas = useMemo(
    () =>
      [...licitacoes]
        .map((lic) => ({ ...lic, scoreCalculado: calcularScorePonderado(lic, criterios, pesos) }))
        .sort((a, b) => b.scoreCalculado - a.scoreCalculado),
    [licitacoes, criterios, pesos],
  )

  function handleAprovar() {
    startTransition(async () => {
      const result = await aprovarPerfil(companyId, criterios, pesos, licitacoesRanqueadas.slice(0, 5))
      if (result?.error) {
        toast.error(result.error)
        return
      }
      router.refresh()
      router.push("/oportunidades")
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
          <p className="text-slate-400 text-sm">Confira os critérios identificados e ajuste os pesos de ranqueamento.</p>
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
            <CheckboxList
              label="Estados (UFs)"
              icon={<MapPin className="h-3.5 w-3.5 text-blue-400" />}
              opcoes={UFS_BRASIL}
              selecionados={criterios.ufs}
              onChange={(v) => updateCriterio("ufs", v)}
            />
            <CheckboxList
              label="Modalidades"
              icon={<Building2 className="h-3.5 w-3.5 text-blue-400" />}
              opcoes={MODALIDADES_LISTA}
              selecionados={criterios.modalidades}
              onChange={(v) => updateCriterio("modalidades", v)}
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

        {/* Seção 2: Pesos de ranqueamento */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-violet-400" />
            Pesos de ranqueamento
          </h2>
          <div className="rounded-xl border border-violet-500/30 bg-slate-800/60 p-5 space-y-5">
            <SliderRow label="Match de CNAE" value={pesos.cnae} onChange={(v) => updatePeso("cnae", v)} />
            <SliderRow label="UF prioritária" value={pesos.uf} onChange={(v) => updatePeso("uf", v)} />
            <SliderRow label="Faixa de valor" value={pesos.valor} onChange={(v) => updatePeso("valor", v)} />
            <SliderRow label="Modalidade preferida" value={pesos.modalidade} onChange={(v) => updatePeso("modalidade", v)} />

            <div className={`flex items-center justify-end pt-2 border-t border-slate-700 gap-2`}>
              <span className="text-sm text-slate-400">Total dos pesos:</span>
              <span className={`text-sm font-bold ${totalPesos === 100 ? "text-green-400" : "text-amber-400"}`}>
                {totalPesos}%
              </span>
              {totalPesos !== 100 && (
                <span className="text-xs text-amber-500">(recomendado: 100%)</span>
              )}
            </div>
          </div>
        </section>

        {/* Seção 3: Preview de licitações */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            Licitações identificadas para você
            <Badge className="bg-blue-600/30 text-blue-300 border-blue-500/30 text-xs ml-1">
              {licitacoesRanqueadas.length} encontradas
            </Badge>
          </h2>

          {licitacoesRanqueadas.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-8 text-center">
              <p className="text-slate-400 text-sm">Nenhuma licitação com score ≥ 70 encontrada nos últimos 7 dias.</p>
              <p className="text-slate-500 text-xs mt-1">Novos editais são sincronizados diariamente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {licitacoesRanqueadas.map((lic) => (
                <div key={lic.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ScoreBadge score={lic.scoreCalculado} />
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
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

        {/* Ações */}
        <section className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button
            onClick={handleAprovar}
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-base font-semibold"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {isPending ? "Salvando..." : "Aprovar Perfil"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/onboarding/entrevista")}
            disabled={isPending}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 h-11"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Ajustar respostas
          </Button>
        </section>
      </div>
    </div>
  )
}
