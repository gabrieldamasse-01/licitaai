import { resend, FROM_EMAIL } from '@/lib/resend'
import { NextResponse } from 'next/server'

/**
 * API Route para enviar relatório de arquivos não utilizados
 * Uso: POST /api/admin/relatorio-nao-utilizados
 */
export async function POST() {
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 8px;">
        Relatório de Arquivos Não Utilizados - LicitaAI
      </h1>

      <h2 style="color: #dc2626; margin-top: 24px;">
        1. Componentes do Template Supabase (Remover com segurança)
      </h2>
      <p style="color: #374151;">Estes arquivos vieram do boilerplate do Supabase e não são utilizados:</p>
      <ul style="background: #fef2f2; padding: 16px 32px; border-radius: 8px;">
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/auth-button.tsx</code></li>
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/deploy-button.tsx</code></li>
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/env-var-warning.tsx</code></li>
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/theme-switcher.tsx</code></li>
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/hero.tsx</code></li>
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/next-logo.tsx</code></li>
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/supabase-logo.tsx</code></li>
        <li><code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">components/tutorial/</code> (pasta inteira - 5 arquivos)</li>
      </ul>

      <h2 style="color: #f59e0b; margin-top: 24px;">
        2. Utilitários Mortos
      </h2>
      <ul style="background: #fffbeb; padding: 16px 32px; border-radius: 8px;">
        <li>
          <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">lib/pncp.ts</code>
          — Função <code>fetchLicitacoesPNCP</code> nunca chamada (projeto usa <code>effecti.ts</code>)
        </li>
        <li>
          <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">lib/plans.ts</code>
          — <code>PLAN_LIMITS</code> nunca importado
        </li>
        <li>
          <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">lib/serializers/licitacao.ts</code>
          — Serializadores nunca usados
        </li>
      </ul>

      <h2 style="color: #f59e0b; margin-top: 24px;">
        3. Componente Órfão
      </h2>
      <ul style="background: #fffbeb; padding: 16px 32px; border-radius: 8px;">
        <li>
          <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">components/documentos-lista.tsx</code>
          — Versão antiga, substituída por <code>documentos-client.tsx</code>
        </li>
      </ul>

      <h2 style="color: #dc2626; margin-top: 24px;">
        4. Bug Crítico Encontrado
      </h2>
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;">
        <p style="margin: 0;">
          <strong>CRÍTICO:</strong> <code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px;">lib/env.ts</code>
          não é importado em nenhum lugar. A validação de variáveis de ambiente nunca roda.
        </p>
        <p style="margin-top: 12px;">
          <strong>Correção necessária:</strong> Adicionar
          <code style="background: #dc2626; color: white; padding: 2px 6px; border-radius: 4px;">import "@/lib/env"</code>
          no topo de <code>lib/supabase/client.ts</code>
        </p>
      </div>

      <h2 style="color: #f59e0b; margin-top: 24px;">
        5. API Route Potencialmente Obsoleta
      </h2>
      <ul style="background: #fffbeb; padding: 16px 32px; border-radius: 8px;">
        <li>
          <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">api/processar-edital/route.ts</code>
          — Chamado apenas pelo componente não utilizado <code>documentos-lista.tsx</code>. Verificar se ainda é necessário.
        </li>
      </ul>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">

      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1f2937;">
          Total: 17 arquivos para remoção segura
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
        Gerado automaticamente pelo Comms Agent — LicitaAI<br>
        ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
      </p>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'gabriel.damasse@mgnext.com',
      subject: 'Relatório: Arquivos Não Utilizados - LicitaAI',
      html,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Exceção ao enviar email:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}