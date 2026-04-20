"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Sparkles, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

type ItemChecklist = {
  nome: string
  camada: "geral" | "nicho" | "edital"
  situacao: "ok" | "vencendo" | "vencido" | "faltando" | "pendente_extracao"
  obrigatorio: boolean
}

type DocRow = {
  tipo: string
  status: string
  data_validade: string | null
}

type DocTypeRow = {
  nome: string
  camada: string
  cnaes_aplicaveis: string[] | null
}

type EditalDoc = {
  nome_exigido: string
  obrigatorio: boolean
}

type Props = {
  licitacaoId: string
  sourceUrl: string | null
  empresaId: string | null
  empresaCnaes: string[]
}

function situacaoIcon(s: ItemChecklist["situacao"]) {
  if (s === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
  if (s === "vencendo") return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
  if (s === "vencido") return <XCircle className="h-4 w-4 text-red-400 shrink-0" />
  if (s === "pendente_extracao") return <Clock className="h-4 w-4 text-slate-400 shrink-0" />
  return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
}

function situacaoLabel(s: ItemChecklist["situacao"]) {
  if (s === "ok") return "Válido"
  if (s === "vencendo") return "Vencendo"
  if (s === "vencido") return "Expirado"
  if (s === "pendente_extracao") return "Não extraído"
  return "Faltando"
}

function camadaBadge(camada: ItemChecklist["camada"]) {
  if (camada === "nicho") return (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-950/50 text-violet-300 border border-violet-800/50">
      Nicho
    </span>
  )
  if (camada === "edital") return (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-950/50 text-blue-300 border border-blue-800/50">
      Edital
    </span>
  )
  return null
}

function calcularSituacao(tipo: string, docs: DocRow[]): ItemChecklist["situacao"] {
  const docsDoTipo = docs.filter((d) => d.tipo === tipo)
  if (docsDoTipo.length === 0) return "faltando"
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const em30 = new Date(hoje); em30.setDate(hoje.getDate() + 30)
  const valido = docsDoTipo.find((d) => {
    if (d.status === "vencido") return false
    if (!d.data_validade) return true
    const val = new Date(d.data_validade + "T00:00:00")
    return val > em30
  })
  if (valido) return "ok"
  const vencendoBreve = docsDoTipo.find((d) => {
    if (!d.data_validade) return false
    const val = new Date(d.data_validade + "T00:00:00")
    return val >= hoje && val <= em30
  })
  if (vencendoBreve) return "vencendo"
  return "vencido"
}

export function ChecklistHabilitacaoLicitacao({ licitacaoId, sourceUrl, empresaId, empresaCnaes }: Props) {
  const [itens, setItens] = useState<ItemChecklist[]>([])
  const [carregando, setCarregando] = useState(true)
  const [extraindo, setExtraindo] = useState(false)
  const [editalExtraido, setEditalExtraido] = useState(false)

  async function carregarItens(incluirEdital = false) {
    if (!empresaId) { setCarregando(false); return }
    setCarregando(true)
    try {
      const supabase = createClient()
      const cnaesDivisoes = empresaCnaes.map((c) => c.replace(/\D/g, "").substring(0, 2))

      const [{ data: docs }, { data: tipos }, { data: editalDocs }] = await Promise.all([
        supabase
          .from("documents")
          .select("tipo, status, data_validade")
          .eq("company_id", empresaId),
        supabase
          .from("document_types")
          .select("nome, camada, cnaes_aplicaveis")
          .order("nome"),
        supabase
          .from("edital_documentos_exigidos")
          .select("nome_exigido, obrigatorio")
          .eq("licitacao_id", licitacaoId),
      ])

      const docsRows = (docs ?? []) as DocRow[]
      const tiposRows = (tipos ?? []) as DocTypeRow[]
      const editalRows = (editalDocs ?? []) as EditalDoc[]

      const listaItens: ItemChecklist[] = []

      // Camada 1 — gerais
      for (const t of tiposRows.filter((t) => t.camada === "geral" || !t.camada)) {
        listaItens.push({
          nome: t.nome,
          camada: "geral",
          situacao: calcularSituacao(t.nome, docsRows),
          obrigatorio: true,
        })
      }

      // Camada 2 — nicho
      for (const t of tiposRows.filter((t) => t.camada === "nicho")) {
        const aplicavel = (t.cnaes_aplicaveis ?? []).some((c) => cnaesDivisoes.includes(c))
        if (!aplicavel) continue
        listaItens.push({
          nome: t.nome,
          camada: "nicho",
          situacao: calcularSituacao(t.nome, docsRows),
          obrigatorio: true,
        })
      }

      // Camada 3 — edital
      if (editalRows.length > 0) {
        setEditalExtraido(true)
        for (const e of editalRows) {
          listaItens.push({
            nome: e.nome_exigido,
            camada: "edital",
            situacao: calcularSituacao(e.nome_exigido, docsRows),
            obrigatorio: e.obrigatorio,
          })
        }
      } else if (!incluirEdital) {
        // Placeholder para mostrar que existem docs do edital a extrair
        listaItens.push({
          nome: "Documentos específicos do edital",
          camada: "edital",
          situacao: "pendente_extracao",
          obrigatorio: false,
        })
      }

      setItens(listaItens)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarItens() }, [empresaId, licitacaoId])

  async function extrairDocumentosEdital() {
    setExtraindo(true)
    try {
      const resp = await fetch("/api/extrair-documentos-edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licitacao_id: licitacaoId, source_url: sourceUrl }),
      })
      const data = await resp.json() as { documentos?: unknown[]; fromCache?: boolean; error?: string }
      if (!resp.ok) {
        toast.error(data.error ?? "Erro ao extrair documentos")
        return
      }
      toast.success(
        data.fromCache
          ? "Documentos carregados do cache"
          : `${data.documentos?.length ?? 0} documentos extraídos com IA`
      )
      await carregarItens(true)
    } finally {
      setExtraindo(false)
    }
  }

  if (!empresaId) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">
        Selecione uma empresa para ver o checklist.
      </p>
    )
  }

  const total = itens.filter((i) => i.situacao !== "pendente_extracao").length
  const emDia = itens.filter((i) => i.situacao === "ok").length
  const pct = total > 0 ? Math.round((emDia / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Cabeçalho de progresso */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-white">{emDia}</span> de{" "}
            <span className="font-bold text-white">{total}</span> documentos em ordem
          </p>
          <span
            className={`text-sm font-bold ${
              pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"
            }`}
          >
            {pct}%
          </span>
        </div>
      )}

      {/* Barra de progresso */}
      {total > 0 && (
        <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
        </div>
      ) : (
        <ul className="divide-y divide-slate-700">
          {itens.map((item) => (
            <li key={item.nome} className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {situacaoIcon(item.situacao)}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm text-slate-200 truncate">{item.nome}</p>
                    {camadaBadge(item.camada)}
                  </div>
                  <p className="text-xs text-slate-500">{situacaoLabel(item.situacao)}</p>
                </div>
              </div>
              {item.situacao !== "ok" && item.situacao !== "pendente_extracao" && (
                <a
                  href="/documentos"
                  className="shrink-0 inline-flex items-center gap-1 rounded border border-blue-700/50 bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-900/60 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </a>
              )}
              {item.situacao === "pendente_extracao" && !editalExtraido && (
                <button
                  onClick={extrairDocumentosEdital}
                  disabled={extraindo}
                  className="shrink-0 inline-flex items-center gap-1 rounded border border-violet-700/50 bg-violet-950/40 px-2.5 py-1 text-xs font-medium text-violet-300 hover:bg-violet-900/60 transition-colors disabled:opacity-60"
                >
                  {extraindo
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Sparkles className="h-3 w-3" />
                  }
                  Extrair com IA
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Botão principal de extração */}
      {!editalExtraido && !carregando && (
        <Button
          onClick={extrairDocumentosEdital}
          disabled={extraindo || !sourceUrl}
          size="sm"
          className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
        >
          {extraindo
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Sparkles className="h-4 w-4" />
          }
          {extraindo ? "Extraindo documentos do edital..." : "Extrair documentos do edital com IA"}
        </Button>
      )}
    </div>
  )
}
