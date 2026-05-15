"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Send, Loader2, CheckCircle2, Undo2, Users, TrendingUp, UserPlus } from "lucide-react"
import { toast } from "sonner"

function limparMarkdown(texto: string): string {
  return texto
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .trim()
}

type Lead = {
  id: string
  nome: string
  email: string
  empresa: string | null
  status: string
  origem: string
  ultima_interacao: string | null
  created_at: string
}

type Conversa = {
  id: string
  role: "user" | "assistant"
  conteudo: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  novo:        { label: "Novo",        className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  contactado:  { label: "Contactado",  className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  interessado: { label: "Interessado", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  convertido:  { label: "Convertido",  className: "bg-green-600/20 text-green-300 border-green-600/30" },
  perdido:     { label: "Perdido",     className: "bg-red-500/20 text-red-300 border-red-500/30" },
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export function CrmTab({ leads: leadsInicial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(leadsInicial)
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loadingConversas, setLoadingConversas] = useState(false)
  const [inputMsg, setInputMsg] = useState("")
  const [isPending, startTransition] = useTransition()
  const [confirmDesfazer, setConfirmDesfazer] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversas])

  async function abrirLead(lead: Lead) {
    setLeadSelecionado(lead)
    setLoadingConversas(true)
    try {
      const res = await fetch(`/api/admin/crm/conversas?lead_id=${lead.id}`)
      const data = await res.json()
      setConversas(data.conversas ?? [])
    } catch {
      toast.error("Erro ao carregar histórico")
    } finally {
      setLoadingConversas(false)
    }
  }

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    if (!inputMsg.trim() || !leadSelecionado) return
    const msg = inputMsg.trim()
    setInputMsg("")
    setConversas((prev) => [
      ...prev,
      { id: "tmp-user", role: "user", conteudo: msg, created_at: new Date().toISOString() },
    ])
    startTransition(async () => {
      try {
        const res = await fetch("/api/vendedora", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadSelecionado.id, mensagem: msg }),
        })
        const data = await res.json()
        if (data.resposta) {
          setConversas((prev) => [
            ...prev,
            { id: "tmp-ana", role: "assistant", conteudo: data.resposta, created_at: new Date().toISOString() },
          ])
          if (data.lead_atualizado) {
            setLeads((prev) =>
              prev.map((l) => l.id === leadSelecionado.id ? { ...l, ...data.lead_atualizado } : l)
            )
            setLeadSelecionado((prev) => prev ? { ...prev, ...data.lead_atualizado } : prev)
          }
        }
      } catch {
        toast.error("Erro ao enviar mensagem")
      }
    })
  }

  async function marcarConvertido() {
    if (!leadSelecionado) return
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/crm/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadSelecionado.id, status: "convertido" }),
        })
        if (res.ok) {
          setLeads((prev) =>
            prev.map((l) => l.id === leadSelecionado.id ? { ...l, status: "convertido" } : l)
          )
          setLeadSelecionado((prev) => prev ? { ...prev, status: "convertido" } : prev)
          toast.success("Lead marcado como convertido!")
        }
      } catch {
        toast.error("Erro ao atualizar status")
      }
    })
  }

  async function desfazerConversao() {
    if (!leadSelecionado) return
    setConfirmDesfazer(false)
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/crm/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadSelecionado.id, status: "interessado" }),
        })
        if (res.ok) {
          setLeads((prev) =>
            prev.map((l) => l.id === leadSelecionado.id ? { ...l, status: "interessado" } : l)
          )
          setLeadSelecionado((prev) => prev ? { ...prev, status: "interessado" } : prev)
          toast.success("Conversão desfeita.")
        }
      } catch {
        toast.error("Erro ao atualizar status")
      }
    })
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const totalLeads = leads.length
  const leadsHoje = leads.filter((l) => l.created_at.slice(0, 10) === hoje).length
  const convertidos = leads.filter((l) => l.status === "convertido").length
  const taxaConversao = totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : "0.0"

  const leadsFiltrados = filtroStatus === "todos"
    ? leads
    : leads.filter((l) => l.status === filtroStatus)

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users,      label: "Total leads",       value: totalLeads,            color: "bg-blue-500/20 text-blue-400" },
          { icon: UserPlus,   label: "Leads hoje",        value: leadsHoje,             color: "bg-indigo-500/20 text-indigo-400" },
          { icon: CheckCircle2, label: "Convertidos",     value: convertidos,           color: "bg-green-500/20 text-green-400" },
          { icon: TrendingUp, label: "Taxa de conversão", value: `${taxaConversao}%`,   color: "bg-emerald-500/20 text-emerald-400" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-4 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.color}`}>
                <m.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs text-slate-400">{m.label}</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 flex-wrap">
        {["todos", "novo", "contactado", "interessado", "convertido", "perdido"].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              filtroStatus === s
                ? "border-blue-500/50 bg-blue-500/20 text-blue-300"
                : "border-slate-700/50 bg-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            {s === "todos" ? "Todos" : STATUS_CONFIG[s]?.label ?? s}
            {s !== "todos" && (
              <span className="ml-1 text-slate-500">({leads.filter((l) => l.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-4" style={{ minHeight: "420px" }}>
        {/* Tabela de leads */}
        <div className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Lead</TableHead>
                <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Empresa</TableHead>
                <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Origem</TableHead>
                <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Última interação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                leadsFiltrados.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={`border-slate-700/30 hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      leadSelecionado?.id === lead.id ? "bg-blue-500/5" : ""
                    }`}
                    onClick={() => abrirLead(lead)}
                  >
                    <TableCell>
                      <div>
                        <p className="text-white text-sm font-medium">{lead.nome}</p>
                        <p className="text-slate-500 text-xs">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-400 text-sm">
                      {lead.empresa ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_CONFIG[lead.status]?.className ?? ""}`}>
                        {STATUS_CONFIG[lead.status]?.label ?? lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-500 text-xs">
                      {lead.origem.replace("_", " ")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-slate-500 text-xs">
                      {formatDate(lead.ultima_interacao)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Painel de chat */}
        {leadSelecionado && (
          <div className="w-80 flex flex-col rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden flex-shrink-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{leadSelecionado.nome}</p>
                <Badge className={`text-xs mt-0.5 ${STATUS_CONFIG[leadSelecionado.status]?.className ?? ""}`}>
                  {STATUS_CONFIG[leadSelecionado.status]?.label ?? leadSelecionado.status}
                </Badge>
              </div>
              {leadSelecionado.status === "convertido" ? (
                confirmDesfazer ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Confirmar?</span>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={desfazerConversao}
                      className="h-6 text-xs px-2 bg-red-600/20 text-red-300 border border-red-600/30 hover:bg-red-600/30"
                    >
                      Sim
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setConfirmDesfazer(false)}
                      className="h-6 text-xs px-2 bg-slate-700/40 text-slate-300 border border-slate-600/30 hover:bg-slate-700/60"
                    >
                      Não
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => setConfirmDesfazer(true)}
                    className="h-7 text-xs bg-slate-700/40 text-slate-300 border border-slate-600/30 hover:bg-slate-700/60"
                  >
                    <Undo2 className="h-3 w-3 mr-1" />
                    Desfazer
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={marcarConvertido}
                  className="h-7 text-xs bg-green-600/20 text-green-300 border border-green-600/30 hover:bg-green-600/30"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Convertido
                </Button>
              )}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingConversas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                </div>
              ) : conversas.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">Nenhuma conversa ainda.</p>
              ) : (
                conversas.map((c, i) => (
                  <div key={c.id ?? i} className={`flex ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs leading-relaxed"
                      style={
                        c.role === "user"
                          ? { background: "rgba(37,99,235,0.25)", color: "#e2e8f0" }
                          : { background: "rgba(15,25,45,0.8)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.06)" }
                      }
                    >
                      {limparMarkdown(c.conteudo)}
                    </div>
                  </div>
                ))
              )}
              {isPending && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-2.5 py-1.5" style={{ background: "rgba(15,25,45,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={enviarMensagem} className="flex gap-2 p-3 border-t border-slate-700/50">
              <Input
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Responder como Ana..."
                disabled={isPending}
                className="flex-1 h-7 text-xs bg-slate-900/60 border-slate-700/50 text-white placeholder:text-slate-600"
              />
              <Button type="submit" disabled={isPending || !inputMsg.trim()} size="sm" className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-500">
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
