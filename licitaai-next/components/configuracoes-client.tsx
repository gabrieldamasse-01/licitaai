'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Building2,
  Tags,
  Bell,
  ShieldCheck,
  Plus,
  X,
  Mail,
  RefreshCw,
  Crown,
  Trash2,
  Tag,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UpgradeButton } from '@/components/upgrade-button'
import { buscarCnaes, type CnaeSugerido } from '@/lib/cnaes-sugeridos'
import {
  salvarPerfil,
  salvarCnaes,
  salvarPreferencias,
  salvarKeywords,
  enviarResetSenha,
  excluirConta,
  toggle2FA,
  salvarNotifConfig,
} from '@/app/actions/configuracoes'

// ─── Types ────────────────────────────────────────────────────────────────────

type Company = {
  id: string
  razao_social: string
  cnpj: string
  email_contato: string | null
  contato: string | null
  cnae: string[]
} | null

type Prefs = {
  alertas_email: boolean
  alert_days: number
  alert_email: string
}

type NotifConfig = {
  email_diario: boolean
  email_urgente: boolean
  in_app: boolean
  horario: string
  score_minimo: number
  whatsapp: boolean
  telefone_whatsapp: string
}

type Plano = {
  plano: string
  planoExpiraEm: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatarTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2) return nums
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="border-t border-slate-700 pt-4">{children}</div>
    </div>
  )
}

// ─── 1. Perfil ────────────────────────────────────────────────────────────────

function PerfilSection({ company }: { company: Company }) {
  const [state, action, pending] = useActionState(salvarPerfil, null)
  const [cnpj, setCnpj] = useState(formatCNPJ(company?.cnpj ?? ''))
  const [telefone, setTelefone] = useState(formatarTelefone(company?.contato ?? ''))

  useEffect(() => {
    if (!state) return
    if ('ok' in state) toast.success('Perfil atualizado!')
    if ('erro' in state) toast.error(state.erro)
  }, [state])

  return (
    <Section
      icon={<Building2 className="h-4 w-4 text-slate-500" />}
      title="Perfil da Empresa"
      description="Nome, CNPJ e contatos principais."
    >
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="razao_social" className="text-slate-300">
              Razão Social <span className="text-red-400">*</span>
            </Label>
            <Input
              id="razao_social"
              name="razao_social"
              defaultValue={company?.razao_social ?? ''}
              placeholder="Empresa LTDA"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnpj" className="text-slate-300">
              CNPJ <span className="text-red-400">*</span>
            </Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email_contato" className="text-slate-300">E-mail de Contato</Label>
            <Input
              id="email_contato"
              name="email_contato"
              type="email"
              defaultValue={company?.email_contato ?? ''}
              placeholder="contato@empresa.com.br"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contato" className="text-slate-300">Telefone</Label>
            <Input
              id="contato"
              name="contato"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
        </div>
        <Button type="submit" disabled={pending} size="sm">
          {pending ? 'Salvando…' : 'Salvar Perfil'}
        </Button>
      </form>
    </Section>
  )
}

// ─── 2. CNAEs ────────────────────────────────────────────────────────────────

function validarCnae(val: string): string | null {
  const digits = val.replace(/\D/g, '')
  if (digits.length < 4) return 'Use o código CNAE (ex: 4120-4/00)'
  return null
}

function CnaesSection({ initialCnaes }: { initialCnaes: string[] }) {
  const [cnaes, setCnaes] = useState<string[]>(initialCnaes)
  const [input, setInput] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sugestoes, setSugestoes] = useState<CnaeSugerido[]>([])
  const [isPending, startTransition] = useTransition()

  function handleInput(val: string) {
    setInput(val)
    setErro(null)
    setSugestoes(val.trim().length >= 2 ? buscarCnaes(val) : [])
  }

  function adicionar(valor?: string) {
    const val = (valor ?? input).trim()
    if (!val) return
    const err = validarCnae(val)
    if (err) { setErro(err); return }
    if (cnaes.includes(val)) { setErro('CNAE já adicionado'); return }
    setCnaes((prev) => [...prev, val])
    setInput('')
    setErro(null)
    setSugestoes([])
  }

  function selecionarSugestao(s: CnaeSugerido) {
    if (cnaes.includes(s.codigo)) { setErro('CNAE já adicionado'); setSugestoes([]); return }
    setCnaes((prev) => [...prev, s.codigo])
    setInput('')
    setErro(null)
    setSugestoes([])
  }

  function remover(cnae: string) {
    setCnaes((prev) => prev.filter((c) => c !== cnae))
  }

  function salvar() {
    startTransition(async () => {
      const result = await salvarCnaes(cnaes)
      if ('ok' in result) toast.success('CNAEs atualizados!')
      else toast.error(result.erro)
    })
  }

  return (
    <Section
      icon={<Tags className="h-4 w-4 text-slate-500" />}
      title="CNAEs de Interesse"
      description="Os CNAEs definem quais licitações aparecem nas suas Oportunidades."
    >
      <div className="space-y-4">
        {/* Lista atual */}
        {cnaes.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhum CNAE cadastrado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cnaes.map((cnae) => (
              <Badge
                key={cnae}
                variant="outline"
                className="flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 text-xs"
              >
                {cnae}
                <button
                  type="button"
                  onClick={() => remover(cnae)}
                  className="rounded-full p-0.5 hover:bg-slate-600 transition-colors"
                  aria-label={`Remover ${cnae}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Adicionar novo */}
        <div className="relative space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); adicionar() }
                if (e.key === 'Escape') setSugestoes([])
              }}
              placeholder="Ex: 6201-5/00 ou digite a descrição"
              className={`flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 ${erro ? 'border-red-500' : ''}`}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => adicionar()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Erro de validação */}
          {erro && (
            <p className="text-xs text-red-400">{erro}</p>
          )}

          {/* Sugestões */}
          {sugestoes.length > 0 && (
            <ul className="absolute z-10 left-0 right-10 rounded-lg border border-slate-600 bg-slate-800 shadow-lg overflow-hidden">
              {sugestoes.map((s) => (
                <li key={s.codigo}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selecionarSugestao(s) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 transition-colors flex items-baseline gap-2"
                  >
                    <span className="font-mono font-semibold text-blue-300 shrink-0">{s.codigo}</span>
                    <span className="text-slate-300 truncate">{s.descricao}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button size="sm" onClick={salvar} disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar CNAEs'}
        </Button>
      </div>
    </Section>
  )
}

// ─── 3. Palavras-chave ────────────────────────────────────────────────────────

const MAX_KEYWORDS = 10

function KeywordsSection({ initialKeywords }: { initialKeywords: string[] }) {
  const [keywords, setKeywords] = useState<string[]>(initialKeywords)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()

  function adicionar() {
    const val = input.trim().toLowerCase()
    if (!val || keywords.includes(val) || keywords.length >= MAX_KEYWORDS) return
    setKeywords((prev) => [...prev, val])
    setInput('')
  }

  function remover(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw))
  }

  function salvar() {
    startTransition(async () => {
      const result = await salvarKeywords(keywords)
      if ('ok' in result) toast.success('Palavras-chave salvas!')
      else toast.error(result.erro)
    })
  }

  return (
    <Section
      icon={<Tag className="h-4 w-4 text-slate-500" />}
      title="Palavras-chave de Busca"
      description="Receba notificações de licitações que contenham estas palavras no objeto. Máximo 10."
    >
      <div className="space-y-4">
        {keywords.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhuma palavra-chave cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <Badge
                key={kw}
                variant="outline"
                className="flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 text-xs bg-indigo-950/40 text-indigo-300 border-indigo-800/50"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => remover(kw)}
                  className="rounded-full p-0.5 hover:bg-slate-600 transition-colors"
                  aria-label={`Remover ${kw}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionar())}
            placeholder='Ex: pavimentação, obras, TI'
            className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            disabled={keywords.length >= MAX_KEYWORDS}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionar}
            disabled={keywords.length >= MAX_KEYWORDS}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {keywords.length >= MAX_KEYWORDS && (
          <p className="text-xs text-amber-400">Limite de {MAX_KEYWORDS} palavras-chave atingido.</p>
        )}

        <Button size="sm" onClick={salvar} disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar Palavras-chave'}
        </Button>
      </div>
    </Section>
  )
}

// ─── 4. Perfil de Licitações ─────────────────────────────────────────────────

function PerfilLicitacoesSection({
  concluida,
  concluidaEm,
}: {
  concluida: boolean
  concluidaEm: string | null
}) {
  const dataFormatada = concluidaEm
    ? new Date(concluidaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  if (concluida) {
    return (
      <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-900/40">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">Perfil de Licitações</h2>
            <p className="text-xs text-emerald-400 mt-0.5 font-medium">Entrevista concluída ✓</p>
            {dataFormatada && (
              <p className="text-xs text-slate-400 mt-0.5">Realizada em {dataFormatada}</p>
            )}
          </div>
        </div>
        <div className="border-t border-emerald-800/40 pt-4">
          <Link href="/onboarding/entrevista">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700/50 bg-transparent px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/30 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Refazer entrevista
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-900/30">
          <ClipboardList className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Perfil de Licitações</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete sua entrevista para que a IA encontre as melhores oportunidades para você.
          </p>
        </div>
      </div>
      <div className="border-t border-amber-800/30 pt-4">
        <Link href="/onboarding/entrevista">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors"
          >
            Iniciar entrevista
          </button>
        </Link>
      </div>
    </div>
  )
}

// ─── 5. Preferências de Notificação ──────────────────────────────────────────

function NotifConfigSection({ notifConfig }: { notifConfig: NotifConfig }) {
  const [state, action, pending] = useActionState(salvarNotifConfig, null)
  const [emailDiario, setEmailDiario] = useState(notifConfig.email_diario)
  const [emailUrgente, setEmailUrgente] = useState(notifConfig.email_urgente)
  const [inApp, setInApp] = useState(notifConfig.in_app)
  const [scoreMinimo, setScoreMinimo] = useState(notifConfig.score_minimo)
  const [whatsapp, setWhatsapp] = useState(notifConfig.whatsapp ?? false)
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState(notifConfig.telefone_whatsapp ?? '')

  useEffect(() => {
    if (!state) return
    if ('ok' in state) toast.success('Preferências de notificação salvas!')
    if ('erro' in state) toast.error(state.erro)
  }, [state])

  return (
    <Section
      icon={<Bell className="h-4 w-4 text-slate-500" />}
      title="Preferências de Notificação"
      description="Controle quais alertas de licitações você recebe e com qual nível mínimo de score."
    >
      <form action={action} className="space-y-5">
        <input type="hidden" name="email_diario" value={String(emailDiario)} />
        <input type="hidden" name="email_urgente" value={String(emailUrgente)} />
        <input type="hidden" name="in_app" value={String(inApp)} />
        <input type="hidden" name="horario" value="08:00" />
        <input type="hidden" name="score_minimo" value={String(scoreMinimo)} />
        <input type="hidden" name="whatsapp" value={String(whatsapp)} />
        <input type="hidden" name="telefone_whatsapp" value={telefoneWhatsapp} />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 p-3">
            <div>
              <p className="text-sm font-medium text-white">Receber e-mail diário de novas licitações</p>
              <p className="text-xs text-slate-400 mt-0.5">Resumo diário das oportunidades detectadas nas últimas 24h.</p>
            </div>
            <Switch checked={emailDiario} onCheckedChange={setEmailDiario} aria-label="E-mail diário" />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 p-3">
            <div>
              <p className="text-sm font-medium text-white">Alertas urgentes — prazo &lt; 3 dias</p>
              <p className="text-xs text-slate-400 mt-0.5">E-mail imediato quando uma licitação relevante encerra em até 3 dias.</p>
            </div>
            <Switch checked={emailUrgente} onCheckedChange={setEmailUrgente} aria-label="Alertas urgentes" />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 p-3">
            <div>
              <p className="text-sm font-medium text-white">Notificações no app</p>
              <p className="text-xs text-slate-400 mt-0.5">Sino de notificações dentro da plataforma.</p>
            </div>
            <Switch checked={inApp} onCheckedChange={setInApp} aria-label="Notificações no app" />
          </div>

          <div className="rounded-lg border border-slate-700 p-3 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Receber alertas por WhatsApp</p>
                <p className="text-xs text-slate-400 mt-0.5">Envio via Z-API para o número cadastrado abaixo.</p>
              </div>
              <Switch checked={whatsapp} onCheckedChange={setWhatsapp} aria-label="Alertas por WhatsApp" />
            </div>
            {whatsapp && (
              <div className="space-y-1">
                <Label className="text-slate-300 text-xs">Telefone para WhatsApp</Label>
                <Input
                  value={formatarTelefone(telefoneWhatsapp)}
                  onChange={(e) => setTelefoneWhatsapp(e.target.value.replace(/\D/g, ''))}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Score mínimo para notificar</Label>
            <span className="text-sm font-bold text-blue-400">{scoreMinimo}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={scoreMinimo}
            onChange={(e) => setScoreMinimo(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>50%</span>
            <span>95%</span>
          </div>
          <p className="text-xs text-slate-400">
            Você receberá alertas de licitações com score acima de{' '}
            <span className="font-semibold text-blue-400">{scoreMinimo}%</span>.
          </p>
        </div>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar preferências'}
        </Button>
      </form>
    </Section>
  )
}

// ─── 6. Preferências de Alerta ───────────────────────────────────────────────

function PreferenciasSection({ prefs }: { prefs: Prefs }) {
  const [state, action, pending] = useActionState(salvarPreferencias, null)
  const [alertasEmail, setAlertasEmail] = useState(prefs.alertas_email)
  const [alertDays, setAlertDays] = useState(String(prefs.alert_days))
  const [testando, setTestando] = useState(false)

  useEffect(() => {
    if (!state) return
    if ('ok' in state) toast.success('Preferências salvas!')
    if ('erro' in state) toast.error(state.erro)
  }, [state])

  async function testarAlerta() {
    setTestando(true)
    try {
      const res = await fetch('/api/cron/alertas/test', { method: 'POST' })
      const json = (await res.json()) as { ok?: boolean; error?: string; enviados?: number }
      if (json.ok) {
        toast.success(
          json.enviados
            ? `Alerta enviado! (${json.enviados} empresa(s) notificada(s))`
            : 'Alerta processado — nenhum documento vencendo no período.',
        )
      } else {
        toast.error(json.error ?? 'Erro ao enviar alerta de teste')
      }
    } catch {
      toast.error('Falha na requisição')
    } finally {
      setTestando(false)
    }
  }

  return (
    <Section
      icon={<Bell className="h-4 w-4 text-slate-500" />}
      title="Preferências de Alerta"
      description="Configure quando e como receber alertas de documentos vencendo."
    >
      <form action={action} className="space-y-5">
        {/* Hidden fields para o useActionState */}
        <input type="hidden" name="alertas_email" value={String(alertasEmail)} />
        <input type="hidden" name="alert_days" value={alertDays} />

        {/* Toggle alertas */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 p-3">
          <div>
            <p className="text-sm font-medium text-white">Receber alertas por e-mail</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Notificações sobre documentos próximos do vencimento.
            </p>
          </div>
          <Switch
            checked={alertasEmail}
            onCheckedChange={setAlertasEmail}
            aria-label="Ativar alertas por e-mail"
          />
        </div>

        {/* Antecedência */}
        <div className="space-y-1.5">
          <Label className="text-slate-300">Antecedência do alerta</Label>
          <Select value={alertDays} onValueChange={setAlertDays} disabled={!alertasEmail}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7" className="text-white focus:bg-slate-700">7 dias antes</SelectItem>
              <SelectItem value="15" className="text-white focus:bg-slate-700">15 dias antes</SelectItem>
              <SelectItem value="30" className="text-white focus:bg-slate-700">30 dias antes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* E-mail dos alertas */}
        <div className="space-y-1.5">
          <Label htmlFor="alert_email" className="text-slate-300">E-mail para alertas</Label>
          <Input
            id="alert_email"
            name="alert_email"
            type="email"
            defaultValue={prefs.alert_email}
            placeholder="alertas@empresa.com.br"
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            disabled={!alertasEmail}
          />
          <p className="text-xs text-slate-400">
            Deixe em branco para usar o e-mail de contato da empresa.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Salvando…' : 'Salvar Preferências'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={testarAlerta}
            disabled={testando}
          >
            <Mail className="h-4 w-4 mr-1.5" />
            {testando ? 'Enviando…' : 'Testar alerta'}
          </Button>
        </div>
      </form>
    </Section>
  )
}

// ─── 7. Segurança ────────────────────────────────────────────────────────────

function SegurancaSection({
  userEmail,
  twoFactorEnabled,
}: {
  userEmail: string
  twoFactorEnabled: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [is2FA, setIs2FA] = useState(twoFactorEnabled)
  const [toggling2FA, setToggling2FA] = useState(false)

  function handleReset() {
    startTransition(async () => {
      const result = await enviarResetSenha()
      if ('ok' in result) {
        toast.success('E-mail de redefinição enviado! Verifique sua caixa de entrada.')
      } else {
        toast.error(result.erro)
      }
    })
  }

  async function handleToggle2FA(enabled: boolean) {
    setToggling2FA(true)
    const result = await toggle2FA(enabled)
    if ('ok' in result) {
      setIs2FA(enabled)
      toast.success(enabled ? 'Verificação em duas etapas ativada!' : 'Verificação em duas etapas desativada.')
    } else {
      toast.error(result.erro)
    }
    setToggling2FA(false)
  }

  return (
    <Section
      icon={<ShieldCheck className="h-4 w-4 text-slate-500" />}
      title="Segurança"
      description="Gerencie a senha e o acesso à sua conta."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">E-mail da conta</p>
          <p className="text-sm font-medium text-white">{userEmail}</p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 p-3">
          <div>
            <p className="text-sm font-medium text-white">Alterar senha</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Enviaremos um link de redefinição para o e-mail acima.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {isPending ? 'Enviando…' : 'Alterar senha'}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 p-3">
          <div>
            <p className="text-sm font-medium text-white">Verificação em duas etapas (2FA)</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Ao fazer login, um código será enviado para o seu e-mail.
            </p>
          </div>
          <Switch
            checked={is2FA}
            onCheckedChange={handleToggle2FA}
            disabled={toggling2FA}
            aria-label="Ativar verificação em duas etapas"
          />
        </div>
      </div>
    </Section>
  )
}

// ─── 8. Plano ─────────────────────────────────────────────────────────────────

function PlanoSection({ plano, planoExpiraEm }: Plano) {
  const isPro = plano === 'pro'

  const expiresFormatted = planoExpiraEm
    ? new Date(planoExpiraEm).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <Section
      icon={<Crown className="h-4 w-4 text-slate-400" />}
      title="Plano atual"
      description="Gerencie sua assinatura e recursos disponíveis."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {isPro ? '⚡ Plano Pro' : 'Plano Gratuito'}
            </p>
            {isPro && expiresFormatted ? (
              <p className="text-xs text-slate-400 mt-0.5">
                Renova em {expiresFormatted}
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                Acesso básico à plataforma
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={
              isPro
                ? 'bg-blue-900/50 text-blue-300 border-blue-700/50'
                : 'bg-slate-700 text-slate-300 border-slate-600'
            }
          >
            {isPro ? 'Pro' : 'Gratuito'}
          </Badge>
        </div>

        {isPro ? (
          <p className="text-xs text-slate-400">
            Para cancelar ou alterar sua assinatura, entre em contato com o suporte.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-950/40 border border-blue-800/50 p-3 text-xs text-blue-300 space-y-1">
              <p className="font-semibold text-blue-200">Plano Pro — R$97/mês</p>
              <p>
                Análise ilimitada de editais com IA, alertas prioritários e suporte dedicado.
              </p>
            </div>
            <UpgradeButton />
          </div>
        )}
      </div>
    </Section>
  )
}

// ─── 9. Excluir Conta ────────────────────────────────────────────────────────

function ExcluirContaSection() {
  const [confirmando, setConfirmando] = useState(false)
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleExcluir() {
    if (texto !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar')
      return
    }
    startTransition(async () => {
      const result = await excluirConta()
      if (result && 'erro' in result) {
        toast.error(result.erro)
      }
      // Se ok, o servidor faz redirect para /auth/login
    })
  }

  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-900/30">
          <Trash2 className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-red-300">Excluir Conta</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos.
          </p>
        </div>
      </div>

      <div className="border-t border-red-900/30 pt-4">
        {!confirmando ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmando(true)}
            className="border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Excluir minha conta
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Para confirmar, digite <span className="font-bold text-red-400">EXCLUIR</span> no campo abaixo:
            </p>
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="EXCLUIR"
              className="bg-slate-800 border-red-800 text-white placeholder:text-slate-500 max-w-xs"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleExcluir}
                disabled={isPending || texto !== 'EXCLUIR'}
              >
                {isPending ? 'Excluindo…' : 'Confirmar exclusão'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setConfirmando(false); setTexto('') }}
                disabled={isPending}
                className="text-slate-400 hover:text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Export principal ─────────────────────────────────────────────────────────

const DEFAULT_NOTIF_CONFIG: NotifConfig = {
  email_diario: true,
  email_urgente: true,
  in_app: true,
  horario: '08:00',
  score_minimo: 70,
  whatsapp: false,
  telefone_whatsapp: '',
}

export function ConfiguracoesClient({
  company,
  prefs,
  userEmail,
  plano,
  planoExpiraEm,
  twoFactorEnabled = false,
  keywords = [],
  notifConfig = DEFAULT_NOTIF_CONFIG,
  entrevistaConcluida = false,
  entrevistaConcluidaEm = null,
}: {
  company: Company
  prefs: Prefs
  userEmail: string
  plano: string
  planoExpiraEm: string | null
  twoFactorEnabled?: boolean
  keywords?: string[]
  notifConfig?: NotifConfig
  entrevistaConcluida?: boolean
  entrevistaConcluidaEm?: string | null
}) {
  return (
    <div className="space-y-4">
      <PlanoSection plano={plano} planoExpiraEm={planoExpiraEm} />
      <PerfilSection company={company} />
      <CnaesSection initialCnaes={company?.cnae ?? []} />
      <KeywordsSection initialKeywords={keywords} />
      <PerfilLicitacoesSection concluida={entrevistaConcluida} concluidaEm={entrevistaConcluidaEm} />
      <NotifConfigSection notifConfig={notifConfig} />
      <PreferenciasSection prefs={prefs} />
      <SegurancaSection userEmail={userEmail} twoFactorEnabled={twoFactorEnabled} />
      <ExcluirContaSection />
    </div>
  )
}
