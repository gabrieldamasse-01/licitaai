"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2,
  Tags,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { criarEmpresaOnboarding, verificarCNPJExistente } from "./actions"

// ─── Dados ────────────────────────────────────────────────────────────────────

const POPULAR_CNAES = [
  { codigo: "4120-4/00", descricao: "Construção de Edifícios" },
  { codigo: "6201-5/01", descricao: "Desenvolvimento de Software" },
  { codigo: "8111-7/00", descricao: "Serviços de Limpeza" },
  { codigo: "8630-5/01", descricao: "Atividades de Saúde" },
  { codigo: "8512-1/00", descricao: "Educação" },
  { codigo: "7112-0/00", descricao: "Engenharia e Consultoria" },
  { codigo: "6311-9/00", descricao: "Tecnologia da Informação" },
  { codigo: "4929-9/99", descricao: "Transporte Rodoviário" },
  { codigo: "3321-0/00", descricao: "Manutenção de Equipamentos" },
  { codigo: "8121-4/00", descricao: "Limpeza de Edifícios" },
]

type EmpresaData = {
  razao_social: string
  cnpj: string
  porte: "MEI" | "ME" | "EPP" | "MEDIO" | "GRANDE"
  contato: string
  email_contato: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const calc = (len: number) => {
    let sum = 0
    let pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(digits[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return result === parseInt(digits[len])
  }

  return calc(12) && calc(13)
}

function formatTelefone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const steps = [
    { label: "Empresa", icon: Building2 },
    { label: "CNAEs", icon: Tags },
    { label: "Pronto!", icon: Sparkles },
  ]
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const Icon = s.icon
        const done = i < step - 1
        const active = i === step - 1
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? "bg-blue-600 border-blue-600"
                    : active
                      ? "bg-white border-blue-600"
                      : "bg-slate-100 border-slate-200"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : (
                  <Icon
                    className={`h-4 w-4 ${active ? "text-blue-600" : "text-slate-400"}`}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-blue-600" : done ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${
                  i < step - 1 ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Passo 1 — Empresa ────────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: EmpresaData
  onChange: (d: Partial<EmpresaData>) => void
  onNext: () => void
}) {
  const [checking, setChecking] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function setFieldError(field: string, msg: string) {
    setErrors((prev) => ({ ...prev, [field]: msg }))
  }

  function clearFieldError(field: string) {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!data.razao_social.trim()) {
      newErrors.razao_social = "Informe a Razão Social"
    }

    if (!data.cnpj.trim()) {
      newErrors.cnpj = "Informe o CNPJ"
    } else if (!validarCNPJ(data.cnpj)) {
      newErrors.cnpj = "CNPJ inválido"
    }

    if (data.email_contato && !validarEmail(data.email_contato)) {
      newErrors.email_contato = "E-mail inválido"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setChecking(true)
    const result = await verificarCNPJExistente(data.cnpj)
    setChecking(false)

    if ("error" in result) {
      setFieldError("cnpj", result.error as string)
      return
    }
    if (result.existe) {
      setFieldError("cnpj", "CNPJ já cadastrado")
      return
    }

    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Building2 className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 text-center">
          Vamos começar! Conte-nos sobre sua empresa.
        </h1>
        <p className="text-sm text-slate-500 text-center">
          Essas informações nos ajudam a encontrar as melhores oportunidades para você.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="razao_social" className="text-slate-700">
          Razão Social <span className="text-red-500">*</span>
        </Label>
        <Input
          id="razao_social"
          value={data.razao_social}
          onChange={(e) => {
            onChange({ razao_social: e.target.value })
            if (errors.razao_social) clearFieldError("razao_social")
          }}
          placeholder="Empresa LTDA"
          autoFocus
          className={`bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 ${errors.razao_social ? "border-red-400" : ""}`}
        />
        {errors.razao_social && (
          <p className="text-xs text-red-500">{errors.razao_social}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cnpj" className="text-slate-700">
          CNPJ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cnpj"
          value={data.cnpj}
          onChange={(e) => {
            onChange({ cnpj: formatCNPJ(e.target.value) })
            if (errors.cnpj) clearFieldError("cnpj")
          }}
          placeholder="00.000.000/0000-00"
          className={`bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 ${errors.cnpj ? "border-red-400" : ""}`}
        />
        {errors.cnpj && (
          <p className="text-xs text-red-500">{errors.cnpj}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="porte" className="text-slate-700">Porte da Empresa</Label>
        <Select
          value={data.porte}
          onValueChange={(v) => onChange({ porte: v as EmpresaData["porte"] })}
        >
          <SelectTrigger id="porte" className="bg-white text-slate-900 border-slate-200">
            <SelectValue placeholder="Selecione o porte" />
          </SelectTrigger>
          <SelectContent className="bg-white text-slate-900 border-slate-200">
            <SelectItem value="MEI">MEI — Microempreendedor Individual</SelectItem>
            <SelectItem value="ME">ME — Microempresa</SelectItem>
            <SelectItem value="EPP">EPP — Pequeno Porte</SelectItem>
            <SelectItem value="MEDIO">Médio Porte</SelectItem>
            <SelectItem value="GRANDE">Grande Porte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email_contato" className="text-slate-700">E-mail de Contato</Label>
          <Input
            id="email_contato"
            type="text"
            value={data.email_contato}
            onChange={(e) => {
              onChange({ email_contato: e.target.value })
              if (errors.email_contato) clearFieldError("email_contato")
            }}
            placeholder="contato@empresa.com"
            className={`bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 ${errors.email_contato ? "border-red-400" : ""}`}
          />
          {errors.email_contato && (
            <p className="text-xs text-red-500">{errors.email_contato}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contato" className="text-slate-700">Telefone</Label>
          <Input
            id="contato"
            value={data.contato}
            onChange={(e) => onChange({ contato: formatTelefone(e.target.value) })}
            placeholder="(11) 99999-9999"
            className="bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      <Button type="submit" disabled={checking} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
        {checking ? "Verificando…" : "Continuar"}
        {!checking && <ArrowRight className="h-4 w-4 ml-2" />}
      </Button>
    </form>
  )
}

// ─── Passo 2 — CNAEs ──────────────────────────────────────────────────────────

function Step2({
  cnaes,
  onAdd,
  onRemove,
  onBack,
  onFinish,
  isPending,
}: {
  cnaes: string[]
  onAdd: (cnae: string) => void
  onRemove: (cnae: string) => void
  onBack: () => void
  onFinish: () => void
  isPending: boolean
}) {
  const [input, setInput] = useState("")

  function adicionar(val?: string) {
    const cnae = (val ?? input).trim()
    if (!cnae || cnaes.includes(cnae)) return
    onAdd(cnae)
    if (!val) setInput("")
  }

  function handleFinish() {
    if (cnaes.length === 0) return toast.error("Adicione ao menos um CNAE")
    onFinish()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
          <Tags className="h-7 w-7 text-violet-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 text-center">
          Em quais áreas sua empresa atua?
        </h1>
        <p className="text-sm text-slate-500 text-center">
          Usamos seus CNAEs para encontrar licitações relevantes automaticamente.
        </p>
      </div>

      {/* Sugestões */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Sugestões populares</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CNAES.map((s) => {
            const val = `${s.codigo} — ${s.descricao}`
            const active = cnaes.includes(val)
            return (
              <button
                key={s.codigo}
                type="button"
                onClick={() => (active ? onRemove(val) : adicionar(val))}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {s.descricao}
              </button>
            )
          })}
        </div>
      </div>

      {/* Input manual */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Adicionar manualmente</p>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                adicionar()
              }
            }}
            placeholder="Ex: 4120-4/00 — Construção de edifícios"
            className="flex-1 bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
          />
          <Button type="button" variant="outline" size="icon" onClick={() => adicionar()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* CNAEs selecionados */}
      {cnaes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">
            Selecionados ({cnaes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {cnaes.map((cnae) => (
              <Badge
                key={cnae}
                variant="outline"
                className="flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 text-xs bg-slate-50"
              >
                <span className="truncate max-w-[200px]">{cnae}</span>
                <button
                  type="button"
                  onClick={() => onRemove(cnae)}
                  className="rounded-full p-0.5 hover:bg-slate-200 transition-colors shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handleFinish}
          disabled={isPending || cnaes.length === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? "Salvando…" : "Finalizar"}
          {!isPending && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}

// ─── Passo 3 — Sucesso ────────────────────────────────────────────────────────

function Step3({ empresa, cnaes }: { empresa: EmpresaData; cnaes: string[] }) {
  const router = useRouter()

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-xl shadow-blue-500/30">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <span className="absolute -top-3 -right-3 animate-bounce text-xl">🎉</span>
          <span className="absolute -bottom-2 -left-4 animate-bounce text-lg" style={{ animationDelay: "150ms" }}>✨</span>
          <span className="absolute top-0 -left-5 animate-bounce text-lg" style={{ animationDelay: "300ms" }}>🎊</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          LicitaAI está pronto para encontrar oportunidades para você! 🎉
        </h1>
        <p className="text-sm text-slate-500">
          Seu perfil foi criado com sucesso. Já estamos buscando licitações relevantes.
        </p>
      </div>

      {/* Resumo */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left space-y-3">
        <div>
          <p className="text-xs text-slate-500">Empresa</p>
          <p className="text-sm font-semibold text-slate-900">{empresa.razao_social}</p>
          <p className="text-xs text-slate-500 font-mono">{empresa.cnpj}</p>
        </div>
        {cnaes.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">CNAEs cadastrados</p>
            <div className="flex flex-wrap gap-1.5">
              {cnaes.slice(0, 4).map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  {c.length > 35 ? c.slice(0, 35) + "…" : c}
                </Badge>
              ))}
              {cnaes.length > 4 && (
                <Badge variant="outline" className="text-xs text-slate-400">
                  +{cnaes.length - 4} mais
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={() => router.push("/oportunidades")}
        className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-semibold"
      >
        Ver minhas oportunidades
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  )
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  const [empresa, setEmpresa] = useState<EmpresaData>({
    razao_social: "",
    cnpj: "",
    porte: "ME",
    contato: "",
    email_contato: "",
  })
  const [cnaes, setCnaes] = useState<string[]>([])

  function addCnae(cnae: string) {
    setCnaes((prev) => (prev.includes(cnae) ? prev : [...prev, cnae]))
  }

  function removeCnae(cnae: string) {
    setCnaes((prev) => prev.filter((c) => c !== cnae))
  }

  function handleFinish() {
    startTransition(async () => {
      const result = await criarEmpresaOnboarding({ ...empresa, cnaes })
      if (result && "error" in result) {
        toast.error(result.error)
        return
      }
      // Dispara email de boas-vindas (fire-and-forget, não bloqueia)
      fetch("/api/email/boas-vindas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razao_social: empresa.razao_social }),
      }).catch(() => {/* silencioso — não crítico */})
      setStep(3)
    })
  }

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl bg-white shadow-2xl shadow-black/20 p-6 md:p-8 text-slate-900">
        <ProgressBar step={step} />

        {step === 1 && (
          <Step1
            data={empresa}
            onChange={(d) => setEmpresa((prev) => ({ ...prev, ...d }))}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2
            cnaes={cnaes}
            onAdd={addCnae}
            onRemove={removeCnae}
            onBack={() => setStep(1)}
            onFinish={handleFinish}
            isPending={isPending}
          />
        )}

        {step === 3 && <Step3 empresa={empresa} cnaes={cnaes} />}
      </div>
    </div>
  )
}
