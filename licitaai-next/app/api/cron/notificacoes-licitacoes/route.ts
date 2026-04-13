import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SupabaseClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { calcularScore } from '@/lib/scoring'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://licitaai-next.vercel.app'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Empresa {
  id: string
  razao_social: string
  cnpj: string
  porte: string
  cnae: string[]
  user_id: string
  email_contato: string | null
}

interface UserInfo {
  id: string
  email: string | null
}

interface Licitacao {
  id: string
  source_id: string | null
  orgao: string | null
  objeto: string | null
  valor_estimado: number | null
  modalidade: string | null
  uf: string | null
  data_encerramento: string | null
}

interface LicitacaoComScore extends Licitacao {
  score: number
  motivo: string
}

// ─── Handler ─────────────────────────────────────────────────────────────────

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

  // Buscar licitações das últimas 24h com status ativa
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: licitacoes, error: errLics } = await supabase
    .from('licitacoes')
    .select('id, source_id, orgao, objeto, valor_estimado, modalidade, uf, data_encerramento')
    .gte('created_at', desde)
    .eq('status', 'ativa')
    .not('objeto', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (errLics) {
    return NextResponse.json({ error: errLics.message }, { status: 500 })
  }

  if (!licitacoes || licitacoes.length === 0) {
    await registrarLog(supabase, inicio, 0, 0, 0)
    return NextResponse.json({ ok: true, licitacoes_novas: 0, users_notificados: 0, emails_enviados: 0 })
  }

  // Buscar todas as empresas com user_id
  const { data: empresas, error: errEmpresas } = await supabase
    .from('companies')
    .select('id, razao_social, cnpj, porte, cnae, user_id, email_contato')
    .eq('ativo', true)
    .not('user_id', 'is', null)
    .not('cnae', 'is', null)

  if (errEmpresas) {
    return NextResponse.json({ error: errEmpresas.message }, { status: 500 })
  }

  if (!empresas || empresas.length === 0) {
    await registrarLog(supabase, inicio, licitacoes.length, 0, 0)
    return NextResponse.json({ ok: true, licitacoes_novas: licitacoes.length, users_notificados: 0, emails_enviados: 0 })
  }

  // Buscar emails dos usuários que não têm email_contato na empresa
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const mapaUsers = new Map<string, string | null>(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? null]),
  )

  // Agrupar empresas por user_id
  const porUser = new Map<string, Empresa[]>()
  for (const empresa of empresas as Empresa[]) {
    const uid = empresa.user_id
    if (!uid) continue
    const lista = porUser.get(uid) ?? []
    lista.push(empresa)
    porUser.set(uid, lista)
  }

  let emailsEnviados = 0
  let usersNotificados = 0
  const notificacoesParaInserir: {
    user_id: string
    tipo: string
    titulo: string
    mensagem: string
    link: string
  }[] = []

  for (const [userId, empresasDoUser] of porUser.entries()) {
    // Para cada empresa do user, calcular score para cada licitação nova
    const licitacoesRelevantes: { empresa: Empresa; licitacoes: LicitacaoComScore[] }[] = []

    for (const empresa of empresasDoUser) {
      const relevantes: LicitacaoComScore[] = []

      for (const lic of licitacoes as Licitacao[]) {
        const { score, motivo } = calcularScore(
          { razao_social: empresa.razao_social, porte: empresa.porte, cnae: empresa.cnae ?? [] },
          { objeto: lic.objeto ?? '', modalidade: lic.modalidade ?? '' },
        )
        if (score >= 70) {
          relevantes.push({ ...lic, score, motivo })
        }
      }

      if (relevantes.length > 0) {
        relevantes.sort((a, b) => b.score - a.score)
        licitacoesRelevantes.push({ empresa, licitacoes: relevantes })
      }
    }

    if (licitacoesRelevantes.length === 0) continue

    // Determinar email de destino: primeiro email_contato não nulo dentre as empresas, fallback para auth
    const emailDestino =
      licitacoesRelevantes.find((e) => e.empresa.email_contato)?.empresa.email_contato ??
      mapaUsers.get(userId) ??
      null

    if (emailDestino) {
      const totalLics = licitacoesRelevantes.reduce((acc, e) => acc + e.licitacoes.length, 0)

      const { error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: emailDestino,
        subject: `\uD83C\uDFAF ${totalLics} nova${totalLics > 1 ? 's' : ''} oportunidade${totalLics > 1 ? 's' : ''} para sua empresa`,
        html: gerarHtml(licitacoesRelevantes),
      })

      if (!sendError) {
        emailsEnviados++
      } else {
        console.error('Resend error para userId', userId, sendError)
      }
    }

    // Notificação in-app por empresa
    for (const { empresa, licitacoes: lics } of licitacoesRelevantes) {
      notificacoesParaInserir.push({
        user_id: userId,
        tipo: 'oportunidade_nova',
        titulo: `${lics.length} nova${lics.length > 1 ? 's' : ''} oportunidade${lics.length > 1 ? 's' : ''} para ${empresa.razao_social}`,
        mensagem: lics.slice(0, 2).map((l) => l.objeto?.slice(0, 80)).join(' | ') + (lics.length > 2 ? ` (+${lics.length - 2})` : ''),
        link: '/oportunidades',
      })
    }

    usersNotificados++
  }

  if (notificacoesParaInserir.length > 0) {
    const { error: errNotif } = await supabase.from('notifications').insert(notificacoesParaInserir)
    if (errNotif) console.error('Erro ao inserir notificacoes:', errNotif)
  }

  await registrarLog(supabase, inicio, licitacoes.length, usersNotificados, emailsEnviados)

  return NextResponse.json({
    ok: true,
    licitacoes_novas: licitacoes.length,
    users_notificados: usersNotificados,
    emails_enviados: emailsEnviados,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function registrarLog(
  supabase: SupabaseClient,
  inicio: number,
  licitacoesNovas: number,
  usersNotificados: number,
  emailsEnviados: number,
): Promise<void> {
  await supabase.from('agent_logs').insert({
    agent: 'comms-agent',
    status: 'success',
    duration_ms: Date.now() - inicio,
    metadata: {
      tipo: 'notificacoes_licitacoes',
      licitacoes_novas: licitacoesNovas,
      users_notificados: usersNotificados,
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

function gerarHtml(grupos: { empresa: Empresa; licitacoes: LicitacaoComScore[] }[]): string {
  const blocos = grupos
    .map(({ empresa, licitacoes }) => {
      const linhas = licitacoes
        .slice(0, 10)
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
                <div style="font-size:12px;color:#6b7280">${escHtml(lic.orgao ?? '—')} ${lic.uf ? '· ' + escHtml(lic.uf) : ''}</div>
              </td>
              <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;white-space:nowrap;vertical-align:top">
                ${formatarValor(lic.valor_estimado)}
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

      return `
        <div style="margin-bottom:32px">
          <h2 style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827">
            ${escHtml(empresa.razao_social)}
          </h2>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280">
            ${licitacoes.length} oportunidade${licitacoes.length > 1 ? 's' : ''} com score &ge; 70%
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb">
                  Objeto / \u00d3rg\u00e3o
                </th>
                <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;white-space:nowrap">
                  Valor Est.
                </th>
                <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb">
                  Score
                </th>
                <th style="padding:10px 14px;border-bottom:1px solid #e5e7eb"></th>
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
        </div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novas Oportunidades \u2014 LicitaAI</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

          <!-- Cabecalho -->
          <tr>
            <td style="background:#1a56db;padding:24px 32px">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">
                LicitaAI
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">
                Novas oportunidades de licita\u00e7\u00e3o detectadas
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827">
                \uD83C\uDFAF Novas licitações no seu nicho
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280">
                Encontramos oportunidades publicadas nas \u00faltimas 24 horas com alto potencial para suas empresas.
              </p>

              ${blocos}

              <!-- Botao CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-top:8px">
                <tr>
                  <td style="background:#1a56db;border-radius:6px">
                    <a href="${APP_URL}/oportunidades"
                       style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px">
                      Ver todas as oportunidades
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodape -->
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5">
                Voc\u00ea recebe este e-mail porque seu cadastro no LicitaAI est\u00e1 ativo.
                Para n\u00e3o receber mais notifica\u00e7\u00f5es, acesse
                <a href="${APP_URL}/configuracoes" style="color:#1a56db;text-decoration:none">Configura\u00e7\u00f5es</a>.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">
                &copy; ${new Date().getFullYear()} LicitaAI &mdash; Todos os direitos reservados
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
