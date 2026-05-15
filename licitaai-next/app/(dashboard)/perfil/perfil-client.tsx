'use client'

import { useState, useTransition, useRef } from 'react'
import { toast } from 'sonner'
import {
  User, Mail, Building2, Shield,
  Crown, CheckCircle, Bell, Target,
  AlertTriangle, Sparkles, AlertCircle, Edit3, Key, Camera, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { salvarPerfil, enviarResetSenha } from '@/app/actions/configuracoes'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserInfo = {
  id: string
  email: string
  createdAt: string
}

type Company = {
  id: string
  razao_social: string
  cnpj: string
  email_contato: string | null
  contato: string | null
} | null

type Notificacao = {
  id: string
  titulo: string
  mensagem: string
  tipo: string
  created_at: string
  lida: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(email: string, razaoSocial?: string | null): string {
  if (razaoSocial) {
    const words = razaoSocial.trim().split(/\s+/)
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
    return words[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function getFirstName(email: string, razaoSocial?: string | null): string {
  if (razaoSocial) return razaoSocial.split(/\s+/)[0]
  return email.split('@')[0].split(/[._-]/)[0].replace(/^\w/, (c) => c.toUpperCase())
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr.replace(' ', 'T')), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function tempoRelativo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `${horas}h atrás`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ontem'
  return `${dias} dias atrás`
}

function IconeTipo({ tipo }: { tipo: string }) {
  if (tipo === 'documento_vencendo') return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
  if (tipo === 'documento_expirado') return <AlertCircle className="h-3.5 w-3.5 text-red-400" />
  if (tipo === 'oportunidade_salva') return <Target className="h-3.5 w-3.5 text-blue-400" />
  return <Sparkles className="h-3.5 w-3.5 text-blue-400" />
}

function PlanoBadge({ plano }: { plano: string }) {
  if (plano === 'pro' || plano === 'premium') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
        <Crown className="h-3 w-3" />
        Pro
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-400">
      Gratuito
    </span>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] backdrop-blur-[4px] overflow-hidden" style={{ background: 'rgba(30,41,59,0.7)' }}>
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-6 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Icon className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PerfilClient({
  user,
  company,
  plano,
  planoExpiraEm,
  notificacoes,
  totalMatches,
  nome,
  telefone,
  cargo,
  avatarUrl: avatarUrlProp,
}: {
  user: UserInfo
  company: Company
  plano: string
  planoExpiraEm: string | null
  notificacoes: Notificacao[]
  totalMatches: number
  nome: string | null
  telefone: string | null
  cargo: string | null
  avatarUrl: string | null
}) {
  const initials = getInitials(user.email, company?.razao_social)
  const firstName = getFirstName(user.email, company?.razao_social)

  const [editando, setEditando] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [enviandoReset, setEnviandoReset] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(avatarUrlProp)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formNome, setFormNome] = useState(company?.razao_social ?? '')
  const [formEmail, setFormEmail] = useState(company?.email_contato ?? '')
  const [formContato, setFormContato] = useState(company?.contato ?? '')
  const [formNomePessoa, setFormNomePessoa] = useState(nome ?? '')
  const [formTelefone, setFormTelefone] = useState(telefone ?? '')
  const [formCargo, setFormCargo] = useState(cargo ?? '')

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return }

    setUploadingAvatar(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = data.publicUrl + '?t=' + Date.now()

      const { error: dbErr } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, avatar_url: data.publicUrl }, { onConflict: 'user_id' })
      if (dbErr) throw dbErr

      setAvatarUrl(publicUrl)
      toast.success('Foto atualizada')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao fazer upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  function handleSalvar() {
    const fd = new FormData()
    fd.set('razao_social', formNome)
    fd.set('cnpj', company?.cnpj ?? '')
    fd.set('email_contato', formEmail)
    fd.set('contato', formContato)

    startTransition(async () => {
      const res = await salvarPerfil(undefined, fd)
      if ('erro' in res) {
        toast.error(res.erro)
        return
      }
      // Salva campos pessoais em user_preferences
      const supabase = createClient()
      await supabase
        .from('user_preferences')
        .update({ nome: formNomePessoa || null, telefone: formTelefone || null, cargo: formCargo || null })
        .eq('user_id', user.id)
      toast.success('Perfil atualizado')
      setEditando(false)
    })
  }

  async function handleResetSenha() {
    setEnviandoReset(true)
    try {
      const res = await enviarResetSenha()
      if ('erro' in res) {
        toast.error(res.erro)
      } else {
        toast.success('E-mail de redefinição enviado para ' + user.email)
      }
    } catch {
      toast.error('Erro ao enviar e-mail')
    } finally {
      setEnviandoReset(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header com avatar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie seus dados e veja sua atividade.</p>
        </div>
      </div>

      {/* Avatar card */}
      <div className="rounded-2xl border border-white/[0.07] backdrop-blur-[4px] p-6" style={{ background: 'rgba(30,41,59,0.7)' }}>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0 group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="block h-20 w-20 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Alterar foto"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-600 text-2xl font-black text-white">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {uploadingAvatar
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />
                }
              </div>
            </button>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-900 shadow">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{firstName}</h2>
              <PlanoBadge plano={plano} />
            </div>
            <p className="text-sm text-slate-400 mt-0.5 truncate">{user.email}</p>
            {company?.cnpj && (
              <p className="text-xs text-slate-500 mt-0.5">CNPJ: {company.cnpj}</p>
            )}
            <p className="text-xs text-slate-600 mt-2">
              Membro desde {formatDate(user.createdAt)}
            </p>
          </div>

          {/* Stats rápidas */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="text-right">
              <p className="text-2xl font-black text-white">{totalMatches}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Oportunidades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dados da empresa */}
      <Section title="Dados da Empresa" icon={Building2}>
        {editando ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dados pessoais</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Seu nome</Label>
                <Input
                  value={formNomePessoa}
                  onChange={(e) => setFormNomePessoa(e.target.value)}
                  placeholder="Nome completo"
                  className="bg-slate-800/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Cargo</Label>
                <Input
                  value={formCargo}
                  onChange={(e) => setFormCargo(e.target.value)}
                  placeholder="Ex: Gerente de Licitações"
                  className="bg-slate-800/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-300 text-xs">Telefone pessoal</Label>
                <Input
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="bg-slate-800/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Dados da empresa</p>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Razão Social</Label>
              <Input
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="bg-slate-800/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">E-mail de Contato</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="bg-slate-800/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Telefone / WhatsApp da empresa</Label>
              <Input
                value={formContato}
                onChange={(e) => setFormContato(e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSalvar} disabled={isPending} size="sm">
                {isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditando(false)} className="text-slate-400">
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {(nome || cargo || telefone) && (
              <>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dados pessoais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nome && <InfoRow icon={User} label="Nome" value={nome} />}
                  {cargo && <InfoRow icon={Shield} label="Cargo" value={cargo} />}
                  {telefone && <InfoRow icon={Mail} label="Telefone pessoal" value={telefone} />}
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">Dados da empresa</p>
              </>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={Building2} label="Razão Social" value={company?.razao_social ?? '—'} />
              <InfoRow icon={Shield} label="CNPJ" value={company?.cnpj ?? '—'} />
              <InfoRow icon={Mail} label="E-mail de Contato" value={company?.email_contato ?? '—'} />
              <InfoRow icon={User} label="Telefone / WhatsApp" value={company?.contato ?? '—'} />
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50 gap-1.5"
                onClick={() => setEditando(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Editar dados
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* Conta & Segurança */}
      <Section title="Conta e Segurança" icon={Shield}>
        <div className="space-y-4">
          <InfoRow icon={Mail} label="E-mail da conta" value={user.email} />

          {plano !== 'gratuito' && planoExpiraEm && (
            <InfoRow icon={Crown} label="Plano Pro válido até" value={formatDate(planoExpiraEm)} />
          )}

          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Senha</p>
                <p className="text-xs text-slate-500 mt-0.5">Enviaremos um link de redefinição para seu e-mail.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50 gap-1.5 shrink-0"
                onClick={handleResetSenha}
                disabled={enviandoReset}
              >
                <Key className="h-3.5 w-3.5" />
                {enviandoReset ? 'Enviando...' : 'Alterar senha'}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Histórico de atividade */}
      {notificacoes.length > 0 && (
        <Section title="Atividade Recente" icon={Bell}>
          <ul className="space-y-0 divide-y divide-white/[0.05]">
            {notificacoes.map((n) => (
              <li key={n.id} className={cn('flex items-start gap-3 py-3 first:pt-0 last:pb-0', !n.lida && 'opacity-100')}>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-white/[0.06]">
                  <IconeTipo tipo={n.tipo} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium leading-snug', n.lida ? 'text-slate-400' : 'text-white')}>
                    {n.titulo}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.mensagem}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.lida && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                  <span className="text-[10px] text-slate-600 whitespace-nowrap">{tempoRelativo(n.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 border border-white/[0.06]">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}
