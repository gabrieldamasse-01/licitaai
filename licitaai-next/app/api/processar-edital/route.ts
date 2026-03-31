import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Pega os dados do body (documento_id e url do PDF)
    const { documento_id, arquivo_url, nome } = await request.json()

    if (!documento_id || !arquivo_url) {
      return NextResponse.json(
        { error: 'documento_id e arquivo_url são obrigatórios' },
        { status: 400 }
      )
    }

    // Dispara o webhook do n8n
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documento_id,
        arquivo_url,
        nome,
        user_id: user.id,
      }),
    })

    if (!n8nResponse.ok) {
      throw new Error(`n8n retornou status ${n8nResponse.status}`)
    }

    // Atualiza status do documento para "processando"
    await supabase
      .from('documents')
      .update({ status: 'processando' })
      .eq('id', documento_id)

    return NextResponse.json({ success: true, message: 'Processamento iniciado' })
  } catch (error) {
    console.error('Erro ao acionar n8n:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
