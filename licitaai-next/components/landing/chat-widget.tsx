"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mensagem = {
  role: "user" | "assistant"
  conteudo: string
}

export function ChatWidget() {
  const [aberto, setAberto] = useState(false)
  const [fase, setFase] = useState<"form" | "chat">("form")
  const [leadId, setLeadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [inputMsg, setInputMsg] = useState("")

  // Form fields
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [empresa, setEmpresa] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [mensagens])

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, empresa, origem: "widget_landing" }),
      })
      const data = await res.json()
      if (data.lead_id) {
        setLeadId(data.lead_id)
        setMensagens([{ role: "assistant", conteudo: data.primeira_mensagem }])
        setFase("chat")
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function handleEnviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    if (!inputMsg.trim() || !leadId) return
    const msg = inputMsg.trim()
    setInputMsg("")
    setMensagens((prev) => [...prev, { role: "user", conteudo: msg }])
    setLoading(true)
    try {
      const res = await fetch("/api/vendedora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, mensagem: msg }),
      })
      const data = await res.json()
      if (data.resposta) {
        setMensagens((prev) => [...prev, { role: "assistant", conteudo: data.resposta }])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {aberto && (
        <div className="w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            background: "rgba(10,18,35,0.97)",
            border: "1px solid rgba(96,165,250,0.25)",
            maxHeight: "520px",
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: "rgba(37,99,235,0.2)", borderBottom: "1px solid rgba(96,165,250,0.15)" }}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sm font-bold text-blue-300">
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Ana</p>
                <p className="text-xs text-blue-300/70">Consultora LicitaAI</p>
              </div>
            </div>
            <button onClick={() => setAberto(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {fase === "form" ? (
            <form onSubmit={handleSubmitForm} className="p-4 flex flex-col gap-3 flex-1">
              <p className="text-sm text-slate-300">
                Olá! Sou a Ana, consultora da LicitaAI. Para começarmos, me conta um pouco sobre você:
              </p>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Nome *</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="h-8 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-8 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Empresa</Label>
                <Input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Nome da empresa"
                  className="h-8 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-500 text-white"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Iniciar conversa"}
              </Button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "340px" }}>
                {mensagens.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed"
                      style={
                        m.role === "user"
                          ? { background: "rgba(37,99,235,0.3)", color: "#e2e8f0" }
                          : { background: "rgba(30,41,59,0.8)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.06)" }
                      }
                    >
                      {m.conteudo}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleEnviarMensagem} className="flex gap-2 p-3 border-t border-slate-700/40">
                <Input
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={loading}
                  className="flex-1 h-8 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500"
                />
                <Button type="submit" disabled={loading || !inputMsg.trim()} size="sm" className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setAberto((v) => !v)}
        className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.9), rgba(29,78,216,0.95))",
          border: "1px solid rgba(96,165,250,0.4)",
          boxShadow: "0 8px 32px rgba(37,99,235,0.4)",
        }}
        aria-label="Falar com especialista"
      >
        {aberto ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>
    </div>
  )
}
