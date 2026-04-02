'use client'

import { useActionState, useEffect, useState } from 'react'
import { salvarEmailContato } from '@/app/actions/configuracoes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface ConfiguracoesEmailProps {
  emailAtual: string | null
}

export function ConfiguracoesEmail({ emailAtual }: ConfiguracoesEmailProps) {
  const [state, action, pending] = useActionState(salvarEmailContato, null)
  const [testando, setTestando] = useState(false)

  useEffect(() => {
    if (!state) return
    if ('ok' in state) toast.success('E-mail atualizado com sucesso!')
    if ('erro' in state) toast.error(state.erro)
  }, [state])

  async function testarAlerta() {
    setTestando(true)
    try {
      const res = await fetch('/api/cron/alertas', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}`,
        },
      })
      const json = (await res.json()) as { ok?: boolean; error?: string; enviados?: number }
      if (json.ok) {
        toast.success(
          json.enviados
            ? `Alerta enviado! (${json.enviados} empresa(s) notificada(s))`
            : 'Alerta processado — nenhum documento vencendo nos próximos 30 dias.',
        )
      } else {
        toast.error(json.error ?? 'Erro ao enviar alerta de teste')
      }
    } catch {
      toast.error('Falha na requisição de teste')
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">E-mail de notificações</CardTitle>
          <CardDescription>
            Endereço usado para alertas de documentos vencendo e briefings semanais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email_contato">E-mail de contato</Label>
              <Input
                id="email_contato"
                name="email_contato"
                type="email"
                placeholder="contato@suaempresa.com.br"
                defaultValue={emailAtual ?? ''}
                required
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? 'Salvando…' : 'Salvar e-mail'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Testar alerta de vencimento</CardTitle>
          <CardDescription>
            Dispara o cron de alertas manualmente para verificar se o envio está funcionando.
            Só envia e-mail se houver documentos vencendo nos próximos 30 dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={testarAlerta}
            disabled={testando}
            className="w-full sm:w-auto"
          >
            {testando ? 'Enviando…' : 'Testar alerta de e-mail'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
