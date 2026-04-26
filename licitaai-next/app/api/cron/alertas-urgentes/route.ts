import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SupabaseClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { calcularScore } from '@/lib/scoring'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://licitaai-next.vercel.app'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Empresa {
  id: string
  razao_social: string
  cnpj: string
  porte: string
  cnae: string[]
  user_id: string
  email_contato: string | null
}

interface LicitacaoUrgente {
  id: string
  orgao: string | null
  objeto: string | null
  valor_estimado: number | null
  modalidade: string | null
  uf: string | null
  data_encerramento: string | null
}

interface NotifConfig {
  email_urgente: boolean
  in_app: boolean
  score_minimo: number
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const secret = process.env.CRON_SECRET ?? ''

  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const inicio = Date.now()
  let supabase: ReturnType<typeof createServiceClient>
  try {
    supabase = createServiceClient()
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha ao criar cliente Supabase' },
      { status: 500 },
    )
  }

  // Janela: hoje até hoje + 3 dias
  const hoje = new Date()
  const em3dias = new Date(hoje)
  em3dias.setDate(hoje.getDate() + 3)

  const { data: licitacoes, error: errLics } = await supabase
    .from('licitacoes')
    .select('id, orgao, objeto, valor_estimado, modalidade, uf, data_encerramento')
    .eq('status', 'ativa')
    .gte('data_encerramento', hoje.toISOString().split('T')[0])
    .lte('data_encerramento', em3dias.toISOString().split('T')[0])
    .not('objeto', 'is', null)
    .order('data_encerramento', { ascending: true })
    .limit(500)

  if (errLics) {
    return NextResponse.json({ error: errLics.message }, { status: 500 })
  }

  const urgentesEncontradas = licitacoes?.length ?? 0

  if (urgentesEncontradas === 0) {
    await registrarLog(supabase, inicio, 0, 0)
    return NextResponse.json({ ok: true, urgentes_encontradas: 0, emails_enviados: 0 })
  }

  // Buscar notif_config por user_id
  const DEFAULT_NOTIF: NotifConfig = { email_urgente: true, in_app: true, score_minimo: 70 }
  const { data: prefsData } = await supabase
    .from('user_preferences')
    .select('user_id, notif_config')

  const mapaNotif = new Map<string, NotifConfig>(
    (prefsData ?? []).map((p) => [
      p.user_id as string,
      p.notif_config && typeof p.notif_config === 'object'
        ? { ...DEFAULT_NOTIF, ...(p.notif_config as Partial<NotifConfig>) }
        : DEFAULT_NOTIF,
    ]),
  )

  // Buscar empresas ativas
  const { data: empresas, error: errEmpresas } = await supabase
    .from('companies')
    .select('id, razao_social, cnpj, porte, cnae, user_id, email_contato')
    .eq('ativo', true)
    .not('user_id', 'is', null)
    .not('cnae', 'is', null)

  if (errEmpresas || !empresas || empresas.length === 0) {
    await registrarLog(supabase, inicio, urgentesEncontradas, 0)
    return NextResponse.json({ ok: true, urgentes_encontradas: urgentesEncontradas, emails_enviados: 0 })
  }

  // Emails dos usuários (fallback)
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const mapaUsers = new Map<string, string | null>(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? null]),
  )

  // Agrupar empresas por user_id
  const porUser = new Map<string, Empresa[]>()
  for (const empresa of empresas as Empresa[]) {
    if (!empresa.user_id) continue
    const lista = porUser.get(empresa.user_id) ?? []
    lista.push(empresa)
    porUser.set(empresa.user_id, lista)
  }

  let emailsEnviados = 0
  const notificacoesParaInserir: {
    user_id: string
    tipo: string
    titulo: string
    mensagem: string
    link: string
    prioridade?: string
  }[] = []

  for (const [userId, empresasDoUser] of porUser.entries()) {
    const userNotif = mapaNotif.get(userId) ?? DEFAULT_NOTIF
    if (!userNotif.email_urgente && !userNotif.in_app) continue

    const licsRelevantes: (LicitacaoUrgente & { score: number; empresa: string })[] = []

    for (const empresa of empresasDoUser) {
      for (const lic of licitacoes as LicitacaoUrgente[]) {
        const { score } = calcularScore(
          { razao_social: empresa.razao_social, porte: empresa.porte, cnae: empresa.cnae ?? [] },
          { objeto: lic.objeto ?? '', modalidade: lic.modalidade ?? '' },
        )
        if (score >= userNotif.score_minimo) {
          licsRelevantes.push({ ...lic, score, empresa: empresa.razao_social })
        }
      }
    }

    if (licsRelevantes.length === 0) continue

    // Deduplicar por licitação (manter maior score)
    const deduped = new Map<string, typeof licsRelevantes[0]>()
    for (const l of licsRelevantes) {
      const existing = deduped.get(l.id)
      if (!existing || l.score > existing.score) deduped.set(l.id, l)
    }
    const licsUnicas = Array.from(deduped.values()).sort((a, b) => b.score - a.score)

    // Notificação in-app com prioridade alta
    if (userNotif.in_app) {
      notificacoesParaInserir.push({
        user_id: userId,
        tipo: 'alerta_urgente',
        titulo: `⚠️ ${licsUnicas.length} licitaç${licsUnicas.length > 1 ? 'ões' : 'ão'} encerrando em até 3 dias!`,
        mensagem: licsUnicas.slice(0, 2).map((l) => l.objeto?.slice(0, 80)).join(' | ') +
          (licsUnicas.length > 2 ? ` (+${licsUnicas.length - 2})` : ''),
        link: '/oportunidades',
        prioridade: 'alta',
      })
    }

    // E-mail urgente
    if (userNotif.email_urgente) {
      const emailDestino =
        empresasDoUser.find((e) => e.email_contato)?.email_contato ??
        mapaUsers.get(userId) ??
        null

      if (emailDestino) {
        const { error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: emailDestino,
          subject: `⚠️ ${licsUnicas.length} licitaç${licsUnicas.length > 1 ? 'ões' : 'ão'} com prazo encerrando em até 3 dias!`,
          html: gerarHtmlUrgente(licsUnicas),
        })

        if (!sendError) {
          emailsEnviados++
        } else {
          console.error('Resend urgente error userId', userId, sendError)
        }
      }
    }
  }

  if (notificacoesParaInserir.length > 0) {
    const { error: errNotif } = await supabase.from('notifications').insert(notificacoesParaInserir)
    if (errNotif) console.error('Erro ao inserir notificacoes urgentes:', errNotif)
  }

  await registrarLog(supabase, inicio, urgentesEncontradas, emailsEnviados)

  return NextResponse.json({
    ok: true,
    urgentes_encontradas: urgentesEncontradas,
    emails_enviados: emailsEnviados,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registrarLog(
  supabase: SupabaseClient,
  inicio: number,
  urgentesEncontradas: number,
  emailsEnviados: number,
): Promise<void> {
  await supabase.from('agent_logs').insert({
    agent: 'comms-agent',
    status: 'success',
    duration_ms: Date.now() - inicio,
    metadata: {
      tipo: 'alertas_urgentes',
      urgentes_encontradas: urgentesEncontradas,
      emails_enviados: emailsEnviados,
    },
  })
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatarValor(valor: number | null): string {
  if (!valor) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatarData(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function gerarHtmlUrgente(
  lics: (LicitacaoUrgente & { score: number; empresa: string })[],
): string {
  const linhas = lics
    .slice(0, 15)
    .map((lic) => {
      const corScore =
        lic.score >= 95 ? '#166534' :
        lic.score >= 85 ? '#1d4ed8' :
        lic.score >= 75 ? '#92400e' : '#374151'
      const fundoScore =
        lic.score >= 95 ? '#dcfce7' :
        lic.score >= 85 ? '#eff6ff' :
        lic.score >= 75 ? '#fef3c7' : '#f9fafb'

      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;vertical-align:top">
            <div style="font-weight:600;margin-bottom:2px">${escHtml(lic.objeto?.slice(0, 120) ?? '—')}${(lic.objeto?.length ?? 0) > 120 ? '…' : ''}</div>
            <div style="font-size:12px;color:#6b7280">${escHtml(lic.orgao ?? '—')}${lic.uf ? ' · ' + escHtml(lic.uf) : ''}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px">Empresa: ${escHtml(lic.empresa)}</div>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;white-space:nowrap;vertical-align:top">
            ${formatarValor(lic.valor_estimado)}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;vertical-align:top;white-space:nowrap;font-size:13px;color:#dc2626;font-weight:600">
            ⏰ ${formatarData(lic.data_encerramento)}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;vertical-align:top;white-space:nowrap">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;color:${corScore};background:${fundoScore}">
              ${lic.score}%
            </span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;vertical-align:top">
            <a href="${APP_URL}/licitacoes/${escHtml(lic.id)}"
               style="font-size:13px;color:#1a56db;text-decoration:none;font-weight:500">
              Ver &rarr;
            </a>
          </td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alertas Urgentes — LicitaAI</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <tr>
            <td style="background:#dc2626;padding:24px 32px">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff">⚠️ LicitaAI — Alertas Urgentes</p>
              <p style="margin:4px 0 0;font-size:13px;color:#fecaca">Licitações com prazo encerrando em até 3 dias</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827">Ação necessária!</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280">
                As licitações abaixo têm prazo de encerramento nos próximos 3 dias e são relevantes para as suas empresas.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb">
                <thead>
                  <tr style="background:#fef2f2">
                    <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb">Objeto / Órgão</th>
                    <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;white-space:nowrap">Valor Est.</th>
                    <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;white-space:nowrap">Encerramento</th>
                    <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb">Score</th>
                    <th style="padding:10px 14px;border-bottom:1px solid #e5e7eb"></th>
                  </tr>
                </thead>
                <tbody>${linhas}</tbody>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-top:24px">
                <tr>
                  <td style="background:#dc2626;border-radius:6px">
                    <a href="${APP_URL}/oportunidades"
                       style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">
                      Ver todas as oportunidades
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
                Você recebe este e-mail porque ativou alertas urgentes no LicitaAI.
                Para desativar, acesse <a href="${APP_URL}/configuracoes" style="color:#1a56db;text-decoration:none">Configurações</a>.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">
                &copy; ${new Date().getFullYear()} LicitaAI — Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
