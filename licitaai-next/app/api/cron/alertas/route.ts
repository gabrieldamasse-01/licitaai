import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SupabaseClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://licitaai-next.vercel.app'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface DocumentoAlerta {
  id: string
  tipo: string
  nome_arquivo: string
  data_validade: string
  company_id: string
}

interface EmpresaInfo {
  razao_social: string
  email_contato: string | null
  user_id: string | null
}

interface DocumentoComStatus extends DocumentoAlerta {
  diasRestantes: number
  statusLabel: 'vencendo' | 'expirado'
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Validar Authorization: Bearer CRON_SECRET
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

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeStr = hoje.toISOString().split('T')[0]

  const limite = new Date(hoje)
  limite.setDate(limite.getDate() + 30)
  const limiteStr = limite.toISOString().split('T')[0]

  // Buscar documentos vencendo (hoje até hoje+30)
  const { data: vencendo, error: errVencendo } = await supabase
    .from('documents')
    .select('id, tipo, nome_arquivo, data_validade, company_id')
    .gte('data_validade', hojeStr)
    .lte('data_validade', limiteStr)
    .in('status', ['ativo', 'pendente'])

  if (errVencendo) {
    return NextResponse.json({ error: errVencendo.message }, { status: 500 })
  }

  // Buscar documentos expirados (data_validade < hoje) que ainda não foram alertados hoje
  const { data: expirados, error: errExpirados } = await supabase
    .from('documents')
    .select('id, tipo, nome_arquivo, data_validade, company_id')
    .lt('data_validade', hojeStr)
    .in('status', ['ativo', 'vencido', 'pendente'])

  if (errExpirados) {
    return NextResponse.json({ error: errExpirados.message }, { status: 500 })
  }

  const todosDocumentos: DocumentoAlerta[] = [
    ...(vencendo ?? []),
    ...(expirados ?? []),
  ]

  if (todosDocumentos.length === 0) {
    await registrarLog(supabase, inicio, 0)
    return NextResponse.json({ ok: true, enviados: 0 })
  }

  // Agrupar por company_id
  const porEmpresa = todosDocumentos.reduce<Record<string, DocumentoAlerta[]>>((acc, doc) => {
    acc[doc.company_id] = [...(acc[doc.company_id] ?? []), doc]
    return acc
  }, {})

  const companyIds = Object.keys(porEmpresa)

  // Buscar dados das empresas (inclui user_id para notificações)
  const { data: empresas, error: errEmpresas } = await supabase
    .from('companies')
    .select('id, razao_social, email_contato, user_id')
    .in('id', companyIds)
    .eq('ativo', true)

  if (errEmpresas) {
    return NextResponse.json({ error: errEmpresas.message }, { status: 500 })
  }

  const mapaEmpresas = new Map<string, EmpresaInfo & { id: string }>(
    (empresas ?? []).map((e) => [e.id as string, e as EmpresaInfo & { id: string }]),
  )

  let emailsEnviados = 0
  const logsParaInserir: {
    document_id: string
    tipo: string
    destinatario: string
    enviado_em: string
  }[] = []

  const agora = new Date()

  for (const [companyId, docs] of Object.entries(porEmpresa)) {
    const empresa = mapaEmpresas.get(companyId)
    if (!empresa?.email_contato) continue

    // Enriquecer documentos com status calculado
    const docsComStatus: DocumentoComStatus[] = docs.map((doc) => {
      const validade = new Date(doc.data_validade)
      validade.setHours(0, 0, 0, 0)
      const diffMs = validade.getTime() - agora.getTime()
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return {
        ...doc,
        diasRestantes,
        statusLabel: diasRestantes >= 0 ? 'vencendo' : 'expirado',
      }
    })

    // Ordenar: expirados primeiro, depois por dias restantes
    docsComStatus.sort((a, b) => a.diasRestantes - b.diasRestantes)

    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: empresa.email_contato,
      subject: '\u26a0\ufe0f Documentos com vencimento pr\u00f3ximo \u2014 LicitaAI',
      html: gerarHtml(empresa.razao_social, docsComStatus),
    })

    if (!sendError) {
      emailsEnviados++
      const agoraIso = new Date().toISOString()
      for (const doc of docsComStatus) {
        logsParaInserir.push({
          document_id: doc.id,
          tipo: doc.statusLabel,
          destinatario: empresa.email_contato,
          enviado_em: agoraIso,
        })
      }
    }
  }

  // Inserir logs em alert_logs
  if (logsParaInserir.length > 0) {
    await supabase.from('alert_logs').insert(logsParaInserir)
  }

  // Inserir notificações in-app por documento (uma por empresa, agrupada)
  const notificacoesParaInserir: {
    user_id: string
    tipo: string
    titulo: string
    mensagem: string
    link: string
  }[] = []

  for (const [companyId, docs] of Object.entries(porEmpresa)) {
    const empresa = mapaEmpresas.get(companyId)
    if (!empresa?.user_id) continue

    const docsComStatus: DocumentoComStatus[] = docs.map((doc) => {
      const validade = new Date(doc.data_validade)
      validade.setHours(0, 0, 0, 0)
      const diffMs = validade.getTime() - new Date().getTime()
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return { ...doc, diasRestantes, statusLabel: diasRestantes >= 0 ? 'vencendo' : 'expirado' }
    })

    const expirados = docsComStatus.filter((d) => d.statusLabel === 'expirado')
    const vencendoList = docsComStatus.filter((d) => d.statusLabel === 'vencendo')

    if (expirados.length > 0) {
      notificacoesParaInserir.push({
        user_id: empresa.user_id,
        tipo: 'documento_expirado',
        titulo: `${expirados.length} documento${expirados.length > 1 ? 's' : ''} expirado${expirados.length > 1 ? 's' : ''}`,
        mensagem: expirados.map((d) => d.tipo || d.nome_arquivo).join(', '),
        link: '/documentos',
      })
    }

    if (vencendoList.length > 0) {
      const menorDias = Math.min(...vencendoList.map((d) => d.diasRestantes))
      notificacoesParaInserir.push({
        user_id: empresa.user_id,
        tipo: 'documento_vencendo',
        titulo: `${vencendoList.length} documento${vencendoList.length > 1 ? 's' : ''} vencendo em breve`,
        mensagem: `Vence em ${menorDias} dia${menorDias !== 1 ? 's' : ''}: ${vencendoList.map((d) => d.tipo || d.nome_arquivo).join(', ')}`,
        link: '/documentos',
      })
    }
  }

  if (notificacoesParaInserir.length > 0) {
    await supabase.from('notifications').insert(notificacoesParaInserir)
  }

  await registrarLog(supabase, inicio, emailsEnviados)

  return NextResponse.json({ ok: true, enviados: emailsEnviados })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function registrarLog(
  supabase: SupabaseClient,
  inicio: number,
  emailsEnviados: number,
): Promise<void> {
  await supabase.from('agent_logs').insert({
    agent: 'comms-agent',
    status: 'success',
    duration_ms: Date.now() - inicio,
    metadata: { tipo: 'alerta_documentos', emails_enviados: emailsEnviados },
  })
}

function gerarHtml(razaoSocial: string, docs: DocumentoComStatus[]): string {
  const linhas = docs
    .map((doc) => {
      const validade = new Date(doc.data_validade)
      const validadeStr = validade.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

      let statusTexto: string
      let corStatus: string
      let corFundo: string

      if (doc.diasRestantes < 0) {
        statusTexto = `Expirado h\u00e1 ${Math.abs(doc.diasRestantes)} dia(s)`
        corStatus = '#b91c1c'
        corFundo = '#fef2f2'
      } else if (doc.diasRestantes <= 7) {
        statusTexto = `Vence em ${doc.diasRestantes} dia(s)`
        corStatus = '#b45309'
        corFundo = '#fffbeb'
      } else {
        statusTexto = `Vence em ${doc.diasRestantes} dia(s)`
        corStatus = '#1d4ed8'
        corFundo = '#eff6ff'
      }

      return `
        <tr style="background:${corFundo}">
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827">
            ${escHtml(doc.tipo || doc.nome_arquivo)}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;white-space:nowrap">
            ${validadeStr}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;color:${corStatus};white-space:nowrap">
            ${statusTexto}
          </td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alerta de Documentos \u2014 LicitaAI</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

          <!-- Cabecalho -->
          <tr>
            <td style="background:#1a56db;padding:24px 32px">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">
                LicitaAI
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">
                Plataforma de Gest\u00e3o de Licita\u00e7\u00f5es
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827">
                \u26a0\ufe0f Documentos com vencimento pr\u00f3ximo
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280">
                Ol\u00e1, <strong style="color:#111827">${escHtml(razaoSocial)}</strong>.
                Os documentos abaixo precisam da sua aten\u00e7\u00e3o:
              </p>

              <!-- Tabela de documentos -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb">
                <thead>
                  <tr style="background:#f9fafb">
                    <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb">
                      Documento
                    </th>
                    <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb">
                      Validade
                    </th>
                    <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb">
                      Situa\u00e7\u00e3o
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${linhas}
                </tbody>
              </table>

              <!-- Botao CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-top:28px">
                <tr>
                  <td style="background:#1a56db;border-radius:6px">
                    <a href="${APP_URL}/documentos"
                       style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px">
                      Atualizar documentos
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
                <a href="${APP_URL}/configuracoes" style="color:#1a56db;text-decoration:none">Configura\u00e7\u00f5es</a>
                e atualize seu e-mail de contato.
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

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
