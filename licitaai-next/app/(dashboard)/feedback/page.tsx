"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MessageSquare, Bug, Lightbulb, Heart, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { enviarFeedback, type FeedbackData } from "./actions"

const TIPOS = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  { value: "sugestao", label: "Sugestão", icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  { value: "elogio", label: "Elogio", icon: Heart, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
] as const

export default function FeedbackPage() {
  const [tipo, setTipo] = useState<FeedbackData["tipo"]>("sugestao")
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await enviarFeedback({ tipo, titulo, descricao })
      if (result.error) {
        toast.error(result.error)
      } else {
        setEnviado(true)
        setTitulo("")
        setDescricao("")
      }
    })
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <MessageSquare className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Feedback</h1>
          <p className="text-sm text-slate-400">Ajude-nos a melhorar o LicitaAI</p>
        </div>
      </div>

      {enviado ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center space-y-3">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald-500/20">
            <Heart className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-white">Obrigado pelo feedback!</p>
          <p className="text-sm text-slate-400">Sua mensagem foi registrada e nos ajuda a melhorar o produto.</p>
          <Button
            variant="outline"
            className="mt-2 border-slate-600 text-slate-300 hover:text-white"
            onClick={() => setEnviado(false)}
          >
            Enviar outro
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 space-y-5">
          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-slate-300">Tipo</Label>
            <div className="grid grid-cols-3 gap-3">
              {TIPOS.map(({ value, label, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    tipo === value
                      ? `${bg} ${color}`
                      : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${tipo === value ? color : ""}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo" className="text-slate-300">
              Título <span className="text-red-400">*</span>
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Resumo em uma linha"
              required
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao" className="text-slate-300">
              Descrição <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva com detalhes o que aconteceu, o que esperava, ou sua sugestão…"
              rows={5}
              required
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? "Enviando…" : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Feedback
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
