'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
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
import {
  salvarPerfil,
  salvarCnaes,
  salvarPreferencias,
  enviarResetSenha,
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
  const [cnpj, setCnpj] = useState(company?.cnpj ?? '')

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
              defaultValue={company?.contato ?? ''}
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

function CnaesSection({ initialCnaes }: { initialCnaes: string[] }) {
  const [cnaes, setCnaes] = useState<string[]>(initialCnaes)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()

  function adicionar() {
    const val = input.trim()
    if (!val || cnaes.includes(val)) return
    setCnaes((prev) => [...prev, val])
    setInput('')
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionar())}
            placeholder="Ex: 6201-5/01 — Desenvolvimento de software"
            className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
          <Button type="button" variant="outline" size="sm" onClick={adicionar}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button size="sm" onClick={salvar} disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar CNAEs'}
        </Button>
      </div>
    </Section>
  )
}

// ─── 3. Preferências de Alerta ───────────────────────────────────────────────

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

// ─── 4. Segurança ────────────────────────────────────────────────────────────

function SegurancaSection({ userEmail }: { userEmail: string }) {
  const [isPending, startTransition] = useTransition()

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
      </div>
    </Section>
  )
}

// ─── 5. Plano ─────────────────────────────────────────────────────────────────

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

// ─── Export principal ─────────────────────────────────────────────────────────

export function ConfiguracoesClient({
  company,
  prefs,
  userEmail,
  plano,
  planoExpiraEm,
}: {
  company: Company
  prefs: Prefs
  userEmail: string
  plano: string
  planoExpiraEm: string | null
}) {
  return (
    <div className="space-y-4">
      <PlanoSection plano={plano} planoExpiraEm={planoExpiraEm} />
      <PerfilSection company={company} />
      <CnaesSection initialCnaes={company?.cnae ?? []} />
      <PreferenciasSection prefs={prefs} />
      <SegurancaSection userEmail={userEmail} />
    </div>
  )
}
