# 💻 Exemplos de Código Frontend - Integração com Documentos

## 🎯 Objetivo

Exibir e gerenciar documentos processados pela Edge Function no seu frontend React/Next.js

---

## 📦 Dependências Necessárias

```bash
npm install @supabase/supabase-js
```

Já está no seu `package.json`? Verifique em [package.json](package.json)

---

## 🔌 1. Hook para Consultar Documentos

### `hooks/useDocumentos.ts`

```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Documento {
  id: string;
  nome_arquivo: string;
  nome_documento: string;
  data_vencimento: string;
  status: 'pendente' | 'valido' | 'expirado';
  processado_em: string;
  url: string;
}

export function useDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const carregarDocumentos = async () => {
      try {
        setCarregando(true);
        
        const { data, error } = await supabase
          .from('documentos')
          .select('*')
          .order('processado_em', { ascending: false });

        if (error) throw error;

        setDocumentos(data || []);
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao carregar documentos');
      } finally {
        setCarregando(false);
      }
    };

    carregarDocumentos();

    // Subscribe a mudanças em tempo real
    const subscription = supabase
      .from('documentos')
      .on('*', (payload) => {
        if (payload.eventType === 'UPDATE') {
          setDocumentos((prev) =>
            prev.map((d) =>
              d.id === payload.new.id ? payload.new : d
            )
          );
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { documentos, carregando, erro };
}
```

---

## 🎨 2. Componente de Lista de Documentos

### `components/DocumentList.tsx`

```typescript
'use client';

import { useDocumentos } from '@/hooks/useDocumentos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentItemProps {
  nome: string;
  status: 'pendente' | 'valido' | 'expirado';
  dataVencimento: string;
  processadoEm: string;
  url: string;
}

function DocumentItem({
  nome,
  status,
  dataVencimento,
  processadoEm,
  url,
}: DocumentItemProps) {
  // Cores por status
  const statusColors: Record<string, string> = {
    pendente: 'bg-gray-100 text-gray-800',
    valido: 'bg-green-100 text-green-800',
    expirado: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    pendente: '⏳ Processando',
    valido: '✅ Válido',
    expirado: '❌ Expirado',
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{nome}</h3>
        
        <div className="mt-2 text-sm text-gray-600">
          <p>
            Vencimento:{' '}
            <span className="font-medium">
              {format(new Date(dataVencimento), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
            </span>
          </p>
          <p>
            Processado:{' '}
            <span className="font-medium">
              {format(new Date(processadoEm), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          📥 Download
        </a>
      </div>
    </div>
  );
}

export function DocumentList() {
  const { documentos, carregando, erro } = useDocumentos();

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">⏳ Carregando documentos...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        ❌ Erro: {erro}
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        📭 Nenhum documento ainda. Comece fazendo upload!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documentos.map((doc) => (
        <DocumentItem
          key={doc.id}
          nome={doc.nome_documento || doc.nome_arquivo}
          status={doc.status}
          dataVencimento={doc.data_vencimento}
          processadoEm={doc.processado_em}
          url={doc.url}
        />
      ))}
    </div>
  );
}
```

---

## 📤 3. Componente de Upload

### `components/DocumentUpload.tsx`

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export function DocumentUpload() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === 'application/pdf') {
      setArquivo(file);
      setMensagem(null);
    } else {
      setMensagem({
        tipo: 'erro',
        texto: 'Por favor, selecione um arquivo PDF',
      });
    }
  };

  const handleUpload = async () => {
    if (!arquivo) return;

    try {
      setEnviando(true);

      // 1. Fazer upload do PDF
      const nome_arquivo = `${Date.now()}-${arquivo.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(nome_arquivo, arquivo);

      if (uploadError) throw uploadError;

      // 2. Criar registro no banco (será atualizado pela função)
      const { data: fileData } = supabase.storage
        .from('documentos')
        .getPublicUrl(nome_arquivo);

      const { error: dbError } = await supabase
        .from('documentos')
        .insert([
          {
            nome_arquivo: arquivo.name,
            url: fileData.publicUrl,
            status: 'pendente',
          },
        ]);

      if (dbError) throw dbError;

      setMensagem({
        tipo: 'sucesso',
        texto: '✅ PDF enviado! A análise começará em alguns segundos.',
      });

      setArquivo(null);
      if (document.querySelector<HTMLInputElement>('input[type="file"]')) {
        (document.querySelector('input[type="file"]') as HTMLInputElement).value = '';
      }
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        texto: `Erro ao enviar: ${erro instanceof Error ? erro.message : 'Desconhecido'}`,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed rounded-lg bg-gray-50">
      <h2 className="text-xl font-semibold mb-4">📄 Enviar Documento</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        disabled={enviando}
        className="block w-full text-sm text-gray-600 mb-4"
      />

      {arquivo && (
        <p className="text-sm text-gray-700 mb-4">
          Arquivo selecionado: <strong>{arquivo.name}</strong>
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!arquivo || enviando}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {enviando ? '⏳ Enviando...' : '🚀 Enviar PDF'}
      </button>

      {mensagem && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 4. Dashboard de Documentos

### `app/documentos/page.tsx`

```typescript
'use client';

import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';

export default function DocumentosPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          📋 Meus Documentos
        </h1>

        {/* Upload Section */}
        <div className="mb-8">
          <DocumentUpload />
        </div>

        {/* List Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Histórico de Documentos</h2>
          <DocumentList />
        </div>
      </div>
    </main>
  );
}
```

---

## 🔍 5. Componente de Filtro por Status

### `components/DocumentFilter.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { useDocumentos } from '@/hooks/useDocumentos';

interface FilterOptions {
  status?: 'todos' | 'valido' | 'expirado' | 'pendente';
}

export function DocumentFilter() {
  const { documentos } = useDocumentos();
  const [filtro, setFiltro] = useState<FilterOptions['status']>('todos');

  const documentosFiltrados = useMemo(() => {
    if (filtro === 'todos') return documentos;
    return documentos.filter((d) => d.status === filtro);
  }, [documentos, filtro]);

  const contadores = useMemo(
    () => ({
      total: documentos.length,
      validos: documentos.filter((d) => d.status === 'valido').length,
      expirados: documentos.filter((d) => d.status === 'expirado').length,
      pendentes: documentos.filter((d) => d.status === 'pendente').length,
    }),
    [documentos]
  );

  const filterButtons = [
    { label: '📊 Todos', value: 'todos' as const, count: contadores.total },
    { label: '✅ Válidos', value: 'valido' as const, count: contadores.validos },
    { label: '❌ Expirados', value: 'expirado' as const, count: contadores.expirados },
    { label: '⏳ Processando', value: 'pendente' as const, count: contadores.pendentes },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {filterButtons.map(({ label, value, count }) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filtro === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {label}
            <span className="ml-2 font-bold">({count})</span>
          </button>
        ))}
      </div>

      <p className="text-gray-600 mb-4">
        Mostrando {documentosFiltrados.length} de {contadores.total} documento(s)
      </p>

      {/* Renderizar lista filtrada aqui */}
    </div>
  );
}
```

---

## 🔔 6. Notificação de Vencimento

### `hooks/useDocumentosComVencimento.ts`

```typescript
import { useDocumentos } from './useDocumentos';
import { useEffect, useState } from 'react';

interface AlertaVencimento {
  documentoId: string;
  nomeDocumento: string;
  diasParaVencer: number;
  tipo: 'vencendo-em-breve' | 'vencido';
}

export function useDocumentosComVencimento() {
  const { documentos } = useDocumentos();
  const [alertas, setAlertas] = useState<AlertaVencimento[]>([]);

  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const novoAlertas = documentos
      .filter((doc) => doc.status !== 'pendente')
      .map((doc) => {
        const vencimento = new Date(doc.data_vencimento);
        vencimento.setHours(0, 0, 0, 0);
        const diasDiferenca = Math.ceil(
          (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasDiferenca < 0) {
          return {
            documentoId: doc.id,
            nomeDocumento: doc.nome_documento,
            diasParaVencer: diasDiferenca,
            tipo: 'vencido' as const,
          };
        } else if (diasDiferenca <= 30) {
          return {
            documentoId: doc.id,
            nomeDocumento: doc.nome_documento,
            diasParaVencer: diasDiferenca,
            tipo: 'vencendo-em-breve' as const,
          };
        }
        return null;
      })
      .filter((alerta): alerta is AlertaVencimento => alerta !== null);

    setAlertas(novoAlertas);
  }, [documentos]);

  return alertas;
}
```

### Componente de Alertas

```typescript
import { useDocumentosComVencimento } from '@/hooks/useDocumentosComVencimento';

export function VencimentoAlertas() {
  const alertas = useDocumentosComVencimento();

  if (alertas.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alertas.map((alerta) => (
        <div
          key={alerta.documentoId}
          className={`p-4 rounded-lg ${
            alerta.tipo === 'vencido'
              ? 'bg-red-100 text-red-800 border-l-4 border-red-600'
              : 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600'
          }`}
        >
          <strong>{alerta.nomeDocumento}</strong>
          {alerta.tipo === 'vencido' ? (
            <span> - ❌ EXPIRADO há {Math.abs(alerta.diasParaVencer)} dia(s)</span>
          ) : (
            <span> - ⚠️ Vence em {alerta.diasParaVencer} dia(s)</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔗 7. Variáveis de Ambiente (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh... (copie do painel)
```

---

## 📚 Como Usar

1. **Copie os hooks** para pasta `app/hooks/` ou `lib/`
2. **Copie os componentes** para pasta `app/components/`
3. **Configure ENV** em `.env.local`
4. **Importe e use** em suas páginas

Exemplo:
```typescript
import { DocumentList } from '@/components/DocumentList';

export default function Home() {
  return <DocumentList />;
}
```

---

## 🎨 Estilos (Tailwind CSS)

Todos os componentes usam **Tailwind CSS**. Certifique-se de que está configurado em seu projeto:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.js`:
```javascript
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 🚀 Próximos Passos

- [ ] Copiar componentes
- [ ] Configurar variáveis de ambiente
- [ ] Testar upload de PDF
- [ ] Adicionar mais recursos (download, delete, etc.)

---

## 💡 Dicas

- Use **`date-fns`** para formatar datas: `npm install date-fns`
- Implemente **RLS** no banco para segurança
- Use **Subscriptions** do Supabase para tempo real
- Adicione **skeleton loaders** para melhor UX
