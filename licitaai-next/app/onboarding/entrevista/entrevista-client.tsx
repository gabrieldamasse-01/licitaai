"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PERGUNTAS_ONBOARDING, UFS_BRASIL, type PerguntaOnboarding } from "@/lib/entrevista-perguntas"
import { salvarResposta, concluirEntrevista } from "./actions"

interface Props {
  entrevistaId: string
  respostasIniciais: Record<string, unknown>
}

function BarraProgresso({ atual, total }: { atual: number; total: number }) {
  const pct = Math.round((atual / total) * 100)
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>Pergunta {atual} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function RespostaSelect({
  pergunta,
  valor,
  onChange,
}: {
  pergunta: PerguntaOnboarding
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="bg-white text-slate-900 border-slate-200">
        <SelectValue placeholder="Selecione uma opção..." />
      </SelectTrigger>
      <SelectContent className="bg-white text-slate-900 border-slate-200">
        {pergunta.opcoes!.map((op) => (
          <SelectItem key={op} value={op}>{op}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function RespostaMultiselect({
  pergunta,
  valor,
  onChange,
}: {
  pergunta: PerguntaOnboarding
  valor: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(op: string) {
    onChange(valor.includes(op) ? valor.filter((v) => v !== op) : [...valor, op])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pergunta.opcoes!.map((op) => {
        const ativo = valor.includes(op)
        return (
          <button
            key={op}
            type="button"
            onClick={() => toggle(op)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
              ativo
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            {op}
          </button>
        )
      })}
    </div>
  )
}

function RespostaMultiselectUFs({
  valor,
  onChange,
}: {
  valor: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(uf: string) {
    onChange(valor.includes(uf) ? valor.filter((v) => v !== uf) : [...valor, uf])
  }

  const todasSelecionadas = valor.length === UFS_BRASIL.length

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onChange(todasSelecionadas ? [] : [...UFS_BRASIL])}
        className="text-xs text-blue-600 hover:underline"
      >
        {todasSelecionadas ? "Desmarcar todos" : "Selecionar todos"}
      </button>
      <div className="flex flex-wrap gap-2">
        {UFS_BRASIL.map((uf) => {
          const ativo = valor.includes(uf)
          return (
            <button
              key={uf}
              type="button"
              onClick={() => toggle(uf)}
              className={`rounded-md border w-12 py-1.5 text-xs font-mono font-semibold transition-all ${
                ativo
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {uf}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RespostaText({
  pergunta,
  valor,
  onChange,
}: {
  pergunta: PerguntaOnboarding
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <Input
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={pergunta.placeholder}
      className="bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
      autoFocus
    />
  )
}

export function EntrevistaClient({ entrevistaId, respostasIniciais }: Props) {
  const router = useRouter()
  const total = PERGUNTAS_ONBOARDING.length
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, unknown>>(respostasIniciais)
  const [gerando, setGerando] = useState(false)
  const [isPending, startTransition] = useTransition()

  const pergunta = PERGUNTAS_ONBOARDING[indice]
  const chave = String(pergunta.id)
  const valorAtual = respostas[chave]

  function getValorSelect(): string {
    return typeof valorAtual === "string" ? valorAtual : ""
  }

  function getValorMulti(): string[] {
    return Array.isArray(valorAtual) ? (valorAtual as string[]) : []
  }

  function getValorText(): string {
    return typeof valorAtual === "string" ? valorAtual : ""
  }

  function setResposta(valor: unknown) {
    setRespostas((prev) => ({ ...prev, [chave]: valor }))
  }

  function respostaValida(): boolean {
    if (pergunta.tipo === "text") return getValorText().trim().length > 0
    if (pergunta.tipo === "select") return getValorSelect().length > 0
    if (pergunta.tipo === "multiselect" || pergunta.tipo === "multiselect-ufs") return getValorMulti().length > 0
    return false
  }

  async function avancar() {
    if (!respostaValida()) {
      toast.error("Responda a pergunta antes de continuar")
      return
    }

    if (indice < total - 1) {
      // Perguntas intermediárias: salva e avança
      startTransition(async () => {
        const result = await salvarResposta(entrevistaId, pergunta.id, respostas[chave])
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        setIndice((i) => i + 1)
      })
    } else {
      // Última pergunta: salva e gera perfil fora do transition para poder setar gerando=true
      await gerarPerfil()
    }
  }

  async function gerarPerfil() {
    const salvo = await salvarResposta(entrevistaId, pergunta.id, respostas[chave])
    if ("error" in salvo) {
      toast.error(salvo.error)
      return
    }

    setGerando(true)

    const result = await concluirEntrevista(entrevistaId, respostas)
    if ("error" in result) {
      toast.error(result.error)
      setGerando(false)
      return
    }

    if (!result.perfilGerado) {
      toast("Perfil será aprimorado em breve", {
        description: "A análise de IA será processada em segundo plano.",
      })
    }

    router.push("/oportunidades")
  }

  const ehUltima = indice === total - 1

  if (gerando) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-lg font-semibold text-slate-900">Analisando suas respostas...</p>
        <p className="text-sm text-slate-500">Estamos gerando seu perfil de licitações com IA</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BarraProgresso atual={indice + 1} total={total} />

      <div>
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
          {pergunta.bloco}
        </p>
        <h2 className="text-lg font-bold text-slate-900 leading-snug">{pergunta.pergunta}</h2>
      </div>

      <div className="min-h-[120px]">
        {pergunta.tipo === "select" && (
          <RespostaSelect pergunta={pergunta} valor={getValorSelect()} onChange={setResposta} />
        )}
        {pergunta.tipo === "multiselect" && (
          <RespostaMultiselect pergunta={pergunta} valor={getValorMulti()} onChange={setResposta} />
        )}
        {pergunta.tipo === "multiselect-ufs" && (
          <RespostaMultiselectUFs valor={getValorMulti()} onChange={setResposta} />
        )}
        {pergunta.tipo === "text" && (
          <RespostaText pergunta={pergunta} valor={getValorText()} onChange={setResposta} />
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIndice((i) => Math.max(0, i - 1))}
          disabled={indice === 0 || isPending}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Button
          type="button"
          onClick={avancar}
          disabled={isPending || !respostaValida()}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : ehUltima ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Gerar meu perfil
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
