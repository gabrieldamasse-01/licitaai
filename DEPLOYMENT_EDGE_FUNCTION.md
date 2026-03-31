# 🚀 Deployment - Edge Function: process-document

## 📋 Pré-requisitos

- ✅ Supabase CLI instalado (`npm install supabase --save-dev`)
- ✅ Projeto Supabase criado em produção
- ✅ Chave de API Anthropic (Claude) configurada
- ✅ Bucket `documentos` criado no Storage

---

## 🔧 Passo 1: Linkar Projeto Supabase

Este comando conecta seu projeto local ao projeto remoto em produção:

```bash
npx supabase link --project-ref <seu-project-ref>
```

📌 **Como obter `<seu-project-ref>`:**
1. Acesse [dashboard.supabase.com](https://dashboard.supabase.com)
2. Selecione seu projeto
3. Copie o **Project Ref** da URL ou de Settings > General > Project Ref

**Exemplo:**
```bash
npx supabase link --project-ref abcdefghijklmnop
```

---

## 🔐 Passo 2: Configurar Secrets (Variáveis de Ambiente)

A Edge Function precisa dessas variáveis de ambiente:

### 2.1 - Chave de API Anthropic (obrigatória)

```bash
npx supabase secrets set AI_API_KEY=sk-ant-...
```

📌 **Como obter:**
1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Vá para **API Keys**
3. Clique em **Create Key** e copie a chave completa

### 2.2 - Secret do Webhook (recomendado para segurança)

```bash
npx supabase secrets set WEBHOOK_SECRET=sua-senha-aleatoria-super-secreta
```

💡 Você pode gerar com: 
```bash
openssl rand -base64 32
```

### 2.3 - Verificar secrets configurados

```bash
npx supabase secrets list
```

---

## 📤 Passo 3: Deploy da Edge Function

### 3.1 - Deploy único (recomendado para produção)

```bash
npx supabase functions deploy process-document
```

Se tudo correr bem, você verá:
```
✔ Function deployed successfully at: https://seu-project.supabase.co/functions/v1/process-document
```

### 3.2 - Deploy com observação de logs (desenvolvimento)

```bash
npx supabase functions deploy process-document --no-verify-jwt
```

### 3.3 - Teste a função localmente (antes de deploy)

```bash
npx supabase functions serve
```

Isso inicia um servidor local na porta 54321. Teste com:

```bash
curl -X POST http://localhost:54321/functions/v1/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "storage.objects",
    "schema": "storage",
    "record": {
      "bucket_id": "documentos",
      "name": "teste.pdf",
      "id": "123",
      "owner": "user123",
      "created_at": "2026-03-25T10:00:00Z",
      "updated_at": "2026-03-25T10:00:00Z",
      "last_accessed_at": "2026-03-25T10:00:00Z",
      "metadata": {}
    },
    "old_record": null
  }'
```

---

## 🪝 Passo 4: Configurar Webhook no Painel Supabase

### O que é um Webhook?

Um webhook é um "gatilho" que chama sua Edge Function automaticamente quando algo acontece no banco de dados ou Storage.

### 4.1 - Criar Storage Webhook (recomendado)

**Via Painel Supabase:**

1. Acesse [dashboard.supabase.com](https://dashboard.supabase.com) → seu projeto
2. Vá para **Storage** → **Webhooks** (na lateral esquerda)
3. Clique em **+ Create a new webhook**

**Configure assim:**

| Campo | Valor |
|-------|-------|
| **Name** | `ProcessDocument` |
| **Events** | Marque apenas ✅ **Insert** |
| **Bucket** | `documentos` |
| **URI** | `https://seu-project.supabase.co/functions/v1/process-document` |
| **HTTP Method** | `POST` |
| **Verify JWT** | ✅ Ativado (recomendado) |

4. Clique em **Save**

---

### 4.2 - Ou criar via SQL (Database Webhook)

Se preferir usar **Webhooks de Banco** (menos recomendado para este caso):

```sql
-- Permitir extensão http
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Criar webhook no schema público
INSERT INTO supabase_functions.hooks (id, name, table_id, events, function_name, enabled)
VALUES (
  gen_random_uuid(),
  'process_document_webhook',
  (SELECT id FROM pg_tables WHERE tablename = 'storage.objects'),
  ARRAY['INSERT'],
  'process-document',
  true
);
```

---

## 📊 Passo 5: Estrutura de Dados Esperada

### Tabela: `public.documentos`

```sql
id              uuid (chave primária)
created_at      timestamptz
user_id         uuid (quem fez upload)
nome_arquivo    text (ex: "contrato.pdf")
url             text (URL pública do arquivo)
nome_documento  text (preenchido pela IA)
data_vencimento date (preenchido pela IA)
status          text ('pendente', 'valido', 'expirado')
processado_em   timestamptz (quando foi processado)
```

### Bucket: `documentos`

- 📁 Nome: `documentos`
- 🔓 Tipo: Public ou Private (recomenda-se private + URL assinada)

---

## ✅ Fluxo Completo

```
1. Usuário faz upload de PDF
   ↓
2. Webhook dispara POST para Edge Function
   ↓
3. Edge Function baixa PDF do Storage
   ↓
4. Envia para Claude/Anthropic para análise
   ↓
5. Claude retorna: {nome_documento, data_vencimento}
   ↓
6. Edge Function calcula status (válido/expirado)
   ↓
7. Atualiza registro em public.documentos
   ↓
8. ✅ Pronto! Seu frontend já vê os dados
```

---

## 🐛 Troubleshooting

### Erro: "Unauthorized" no webhook

**Causa:** JWT inválido ou secret incorreto  
**Solução:**
```bash
# Desativar verificação JWT temporariamente (APENAS TESTE)
# No painel: Webhook → desmarcar "Verify JWT"
```

### Erro: "AI_API_KEY não configurada"

```bash
# Verificar se secret foi realmente definido
npx supabase secrets list

# Se não aparecer, configurar novamente
npx supabase secrets set AI_API_KEY=sk-ant-seu-token-aqui
```

### Erro: "Cannot find project ref"

```bash
# Fazer o link novamente
npx supabase link --project-ref seu-project-ref
```

### Ver logs da função

```bash
# No painel Supabase: Functions → process-document → Logs
# Ou via CLI:
npx supabase functions list
```

---

## 🎯 Próximos Passos

1. ✅ Rodar todos os comandos de deployment acima
2. ✅ Fazer upload de um PDF de teste no Storage
3. ✅ Verificar se o registro em `documentos` foi criado/atualizado
4. ✅ Integrar frontend para exibir status do documento

---

## 📞 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Webhooks](https://supabase.com/docs/guides/webhooks)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Deno Runtime](https://docs.deno.com)
