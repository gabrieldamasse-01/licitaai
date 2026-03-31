# 📚 Documentação Técnica - Edge Function `process-document`

## 📝 Visão Geral

A Edge Function `process-document` é um servidor Deno que:
- Escuta webhooks do Supabase Storage
- Processa PDFs com inteligência artificial (Anthropic/Claude)
- Atualiza o banco de dados com metadados do documento

---

## 🏗️ Arquitetura

```
┌─────────────────────────┐
│   Upload de PDF         │
│   no Storage            │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Webhook Storage (POST)             │
│  → Trigger automático               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Edge Function (Deno)               │
│  - process-document                 │
│  - Porta: 3000 (local) ou           │
│    supabase.co/functions/v1/...     │
└────────────┬────────────────────────┘
             │
             ├─ Baixa PDF do Storage
             │
             ├─ Converte para Base64
             │
             ├─ Envia para Claude API
             │
             ├─ Recebe: {nome, vencimento}
             │
             └─ Atualiza tabela documentos
```

---

## 📖 Fluxo Detalhado da Função

### 1️⃣ Receber Webhook

```typescript
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
```

- Aceita apenas **POST**
- Rejeita outros métodos com status **405**

### 2️⃣ Validar Segurança

```typescript
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
```

- Verifica se o header `Authorization` contém o secret configurado
- Se `WEBHOOK_SECRET` não estiver definida, essa verificação é **ignorada**
- Rejeita com status **401** se não bater

### 3️⃣ Parse do Payload

```typescript
  let payload: StorageWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }
```

- Converte a requisição em JSON
- Tipagem TypeScript com interface `StorageWebhookPayload`
- Erro **400** se JSON inválido

### 4️⃣ Filtros - Apenas INSERT no Bucket Certo

```typescript
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "Evento ignorado..." }), {
      status: 200,
    });
  }

  const { bucket_id, name: filePath } = payload.record;

  if (bucket_id !== "documentos" || !filePath.toLowerCase().endsWith(".pdf")) {
    return new Response(
      JSON.stringify({ message: "Arquivo ignorado (não é PDF)..." }),
      { status: 200 }
    );
  }
```

- **Tipo**: Só processa `INSERT` (ignora UPDATE e DELETE)
- **Bucket**: Só processa do bucket `documentos`
- **Formato**: Só processa arquivos `.pdf`
- Retorna **200 OK** mesmo ao ignorar (para não retentar o webhook)

### 5️⃣ Inicializar Cliente Supabase

```typescript
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
```

- Usa `service_role` key (acesso total, sem RLS)
- Necessário para atualizar registros de qualquer usuário
- Vars de ambiente fornecidas automaticamente pelo Supabase

### 6️⃣ Baixar PDF do Storage

```typescript
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket_id)
    .download(filePath);

  if (downloadError || !fileData) {
    console.error("Erro ao baixar arquivo:", downloadError);
    return new Response(
      JSON.stringify({ error: "Falha ao baixar o arquivo do Storage" }),
      { status: 500 }
    );
  }
```

- Faz download do PDF como `Blob`
- Retorna erro **500** se falhar

### 7️⃣ Converter para Base64

```typescript
  const pdfArrayBuffer = await fileData.arrayBuffer();
  const pdfBase64 = btoa(
    String.fromCharCode(...new Uint8Array(pdfArrayBuffer))
  );
```

- Converte PDF binário em Base64
- Necessário para enviar via JSON para a API de IA
- `btoa()` é nativa do Deno/navegador

### 8️⃣ Analisar com Claude

```typescript
  analysisResult = await analyzeDocumentWithAI(pdfBase64);
```

Chama a função `analyzeDocumentWithAI()` que:

```typescript
async function analyzeDocumentWithAI(pdfBase64: string): Promise<AIAnalysisResult> {
  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiKey) throw new Error("AI_API_KEY não configurada");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: `Analise este documento PDF e retorne APENAS um JSON...`,
          },
        ],
      },
    ],
  });
```

**O que acontece:**
1. Lê `AI_API_KEY` das variáveis de ambiente
2. Cria cliente Anthropic
3. Envia PDF em base64 + prompt estruturado
4. Claude analisa e retorna JSON

**Prompt para Claude:**
```json
{
  "nome_documento": "Contrato de Serviços",
  "data_vencimento": "2027-03-25"
}
```

### 9️⃣ Extrair e Validar JSON

```typescript
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Resposta da IA não contém JSON válido: ${rawText}`);
  }

  const result = JSON.parse(jsonMatch[0]) as AIAnalysisResult;

  if (!result.nome_documento || !result.data_vencimento) {
    throw new Error(`JSON da IA incompleto: ${JSON.stringify(result)}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.data_vencimento)) {
    throw new Error(`Formato de data inválido: ${result.data_vencimento}`);
  }

  return result;
```

- Usa **regex** para extrair JSON (em caso de markdown ```json)
- Valida que ambos os campos existem
- Valida formato de data com **regex** `YYYY-MM-DD`
- Retorna objeto tipado

### 🔟 Calcular Status

```typescript
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVencimento = new Date(analysisResult.data_vencimento + "T00:00:00");
  const status = dataVencimento >= hoje ? "valido" : "expirado";
```

- **Válido**: data de vencimento >= hoje
- **Expirado**: data de vencimento < hoje
- Ignora horas/minutos (compara apenas dias)

### 1️⃣1️⃣ Obter URL Pública do Arquivo

```typescript
  const { data: publicUrlData } = supabase.storage
    .from(bucket_id)
    .getPublicUrl(filePath);

  const fileUrl = publicUrlData.publicUrl;
  const fileName = filePath.split("/").pop() ?? filePath;
```

- Gera URL pública assinada
- Extrai apenas o nome do arquivo

### 1️⃣2️⃣ Atualizar Banco de Dados

```typescript
  const { data: updateData, error: updateError } = await supabase
    .from("documentos")
    .update({
      nome_documento: analysisResult.nome_documento,
      data_vencimento: analysisResult.data_vencimento,
      status: status,
      processado_em: new Date().toISOString(),
    })
    .or(`url.eq.${fileUrl},nome_arquivo.eq.${fileName}`)
    .select();
```

**Detalhe importante:**
- `.or(\`url.eq.${fileUrl},nome_arquivo.eq.${fileName}\`)`
- Busca por **URL** OU **nome do arquivo**
- Usa `.select()` para retornar quantos registros foram atualizados

### 1️⃣3️⃣ Retornar Resposta

```typescript
  return new Response(
    JSON.stringify({
      success: true,
      arquivo: filePath,
      nome_documento: analysisResult.nome_documento,
      data_vencimento: analysisResult.data_vencimento,
      status,
      registros_atualizados: updateData?.length ?? 0,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
```

- Retorna **200 OK** com resumo da operação
- Inclui quantos registros foram atualizados

---

## 🔐 Variáveis de Ambiente

| Variável | Obrigatória | Origem | Exemplo |
|----------|-------------|--------|---------|
| `SUPABASE_URL` | ✅ | Automática (Supabase) | `https://abcdef.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Automática (Supabase) | `eyJhbGc...` |
| `AI_API_KEY` | ✅ | Configurar manualmente | `sk-ant-...` |
| `WEBHOOK_SECRET` | ❌ | Configurar manualmente | `sua-senha-aleatória` |

---

## 📊 Interface TypeScript

```typescript
interface StorageWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    bucket_id: string;      // "documentos"
    name: string;           // "pasta/arquivo.pdf"
    id: string;             // UUID do arquivo
    owner: string;          // UUID do usuário
    created_at: string;     // ISO 8601
    updated_at: string;     // ISO 8601
    last_accessed_at: string;
    metadata: Record<string, unknown>;
  };
  schema: string;           // "storage"
  old_record: null | Record<string, unknown>;
}

interface AIAnalysisResult {
  nome_documento: string;      // "Contrato de Serviços"
  data_vencimento: string;     // "2027-03-25"
}
```

---

## 🧪 Teste Manual via cURL

```bash
# Com JWT verificado (recomendado)
curl -X POST https://seu-project.supabase.co/functions/v1/process-document \
  -H "Authorization: Bearer seu-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "storage.objects",
    "schema": "storage",
    "record": {
      "bucket_id": "documentos",
      "name": "contrato.pdf",
      "id": "123abc",
      "owner": "user-uuid",
      "created_at": "2026-03-25T10:00:00Z",
      "updated_at": "2026-03-25T10:00:00Z",
      "last_accessed_at": "2026-03-25T10:00:00Z",
      "metadata": {}
    },
    "old_record": null
  }'

# Sem verificação (teste local)
curl -X POST http://localhost:54321/functions/v1/process-document \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## ⚠️ Limitações Conhecidas

1. **Tamanho do PDF**: Claude suporta até ~20MB por requisição
2. **Tempo de timeout**: Edge Functions têm limite de 60 segundos
3. **Base64**: A conversão pode ser lenta para PDFs muito grandes
4. **Data**: Se não houver data de vencimento, usa data de emissão + 1 ano

---

## 🚀 Otimizações Futuras

- [ ] Usar Redis para cache de análises de PDFs idênticos
- [ ] Implementar fila para PDFs muito grandes
- [ ] Suportar múltiplos idiomas com detecção automática
- [ ] Usar modelo mais rápido (claude-3.5-haiku) para documentos simples
- [ ] OCR para documentos scaneados

---

## 📚 Referências

- [Deno Manual](https://docs.deno.com)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Anthropic Claude API](https://docs.anthropic.com/en/api/getting-started)
- [HTTP em Deno](https://docs.deno.com/api/deno/~/Deno.serve)
