#!/usr/bin/env python3
"""Apply all fixes to onboarding-wizard.tsx"""

import re

path = "app/onboarding/onboarding-wizard.tsx"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# ── FIX 1: Add formatTelefone and validarEmail helpers after validarCNPJ ──────
telefone_helper = '''
function formatTelefone(value: string) {
  const digits = value.replace(/\\D/g, "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function validarEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)
}
'''

# Insert after the closing of validarCNPJ function (after "return calc(12) && calc(13)\n}\n")
src = src.replace(
    "  return calc(12) && calc(13)\n}\n\n// ",
    "  return calc(12) && calc(13)\n}\n" + telefone_helper + "\n// "
)

# ── FIX 2: Replace the entire handleSubmit + Step1 state with validated version ──
old_step1_state = '''  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.razao_social.trim()) return toast.error("Informe a raz\u00e3o social")
    if (!data.cnpj.trim()) return toast.error("Informe o CNPJ")
    if (!validarCNPJ(data.cnpj)) return toast.error("CNPJ inv\u00e1lido")

    setChecking(true)
    const result = await verificarCNPJExistente(data.cnpj)
    setChecking(false)

    if ("error" in result) return toast.error(result.error)
    if (result.existe) return toast.error("CNPJ j\u00e1 cadastrado")

    onNext()
  }'''

new_step1_state = '''  const [checking, setChecking] = useState(false)
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
      newErrors.razao_social = "Informe a Raz\u00e3o Social"
    }

    if (!data.cnpj.trim()) {
      newErrors.cnpj = "Informe o CNPJ"
    } else if (!validarCNPJ(data.cnpj)) {
      newErrors.cnpj = "CNPJ inv\u00e1lido"
    }

    if (data.email_contato && !validarEmail(data.email_contato)) {
      newErrors.email_contato = "E-mail inv\u00e1lido"
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
      setFieldError("cnpj", "CNPJ j\u00e1 cadastrado")
      return
    }

    onNext()
  }'''

src = src.replace(old_step1_state, new_step1_state)

# ── FIX 3: Replace razao_social Input to add inline error display ──────────────
old_razao = '''      <div className="space-y-1.5">
        <Label htmlFor="razao_social" className="text-slate-700">
          Raz\u00e3o Social <span className="text-red-500">*</span>
        </Label>
        <Input
          id="razao_social"
          value={data.razao_social}
          onChange={(e) => onChange({ razao_social: e.target.value })}
          placeholder="Empresa LTDA"
          required
          autoFocus
          className="bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
        />
      </div>'''

new_razao = '''      <div className="space-y-1.5">
        <Label htmlFor="razao_social" className="text-slate-700">
          Raz\u00e3o Social <span className="text-red-500">*</span>
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
      </div>'''

src = src.replace(old_razao, new_razao)

# ── FIX 4: Replace CNPJ Input to add inline error display ─────────────────────
old_cnpj = '''      <div className="space-y-1.5">
        <Label htmlFor="cnpj" className="text-slate-700">
          CNPJ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cnpj"
          value={data.cnpj}
          onChange={(e) => onChange({ cnpj: formatCNPJ(e.target.value) })}
          placeholder="00.000.000/0000-00"
          required
          className="bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
        />
      </div>'''

new_cnpj = '''      <div className="space-y-1.5">
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
      </div>'''

src = src.replace(old_cnpj, new_cnpj)

# ── FIX 5: Replace email + phone grid with validation ─────────────────────────
old_grid = '''      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email_contato" className="text-slate-700">E-mail de Contato</Label>
          <Input
            id="email_contato"
            type="email"
            value={data.email_contato}
            onChange={(e) => onChange({ email_contato: e.target.value })}
            placeholder="contato@empresa.com"
            className="bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contato" className="text-slate-700">Telefone</Label>
          <Input
            id="contato"
            value={data.contato}
            onChange={(e) => onChange({ contato: e.target.value })}
            placeholder="(11) 99999-9999"
            className="bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
          />
        </div>
      </div>'''

new_grid = '''      <div className="grid grid-cols-2 gap-3">
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
      </div>'''

src = src.replace(old_grid, new_grid)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Done. Total chars:", len(src))
print("Last 100 chars:", repr(src[-100:]))
