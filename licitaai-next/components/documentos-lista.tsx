'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Documento {
  id: string
  nome_arquivo: string
  file_url: string
  status: string
}

interface DocumentosListaProps {
  documentos: Documento[]
}

export function DocumentosLista({ documentos }: DocumentosListaProps) {
  const [processando, setProcessando] = useState<string | null>(null)

  async function processarEdital(documentoId: string, fileUrl: string, nomeArquivo: string) {
    setProcessando(documentoId)
    try {
      const response = await fetch('/api/processar-edital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento_id: documentoId,
          arquivo_url: fileUrl,
          nome: nomeArquivo,
        }),
      })

      if (!response.ok) {
        console.error('Erro ao processar edital')
        return
      }

      console.log('Processamento iniciado com sucesso!')
    } finally {
      setProcessando(null)
    }
  }

  return (
    <ul className="space-y-2">
      {documentos.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between rounded border p-3">
          <div>
            <p className="font-medium">{doc.nome_arquivo}</p>
            <p className="text-sm text-muted-foreground">{doc.status}</p>
          </div>
          <Button
            size="sm"
            disabled={processando === doc.id || doc.status === 'processando'}
            onClick={() => processarEdital(doc.id, doc.file_url, doc.nome_arquivo)}
          >
            {processando === doc.id ? 'Enviando…' : 'Processar'}
          </Button>
        </li>
      ))}
    </ul>
  )
}
