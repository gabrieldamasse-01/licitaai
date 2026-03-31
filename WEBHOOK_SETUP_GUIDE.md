# 🪝 Configurar Webhook no Painel Supabase

## 📸 Guia Passo-a-Passo

### Opção 1: Storage Webhook (RECOMENDADA)

#### Passo 1: Acessar Dashboard

1. Vá para [dashboard.supabase.com](https://dashboard.supabase.com)
2. Faça login com sua conta
3. Selecione seu projeto **LicitaAI**

#### Passo 2: Ir para Webhooks

1. No menu lateral esquerdo, clique em **Storage**
2. Você verá uma lista de buckets (ex: `documentos`, `avatares`, etc)
3. **⚠️ IMPORTANTE**: Procure por **Webhooks** na seção de Storage
   - Algumas versões mostram em abas horizontais
   - Outras em um submenu lateral

```
┌─ Storage
│  ├─ Buckets
│  ├─ Policies
│  └─ 🪝 Webhooks  ← CLIQUE AQUI
└─ ...
```

#### Passo 3: Criar Webhook

1. Clique em **+ Create a new webhook** (botão azul no canto superior)
2. Uma modal irá abrir

#### Passo 4: Preencher Campos

```
┌─────────────────────────────────────────────────────────────┐
│                    Create a new webhook                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Name *                                                       │
│ [ProcessDocuments] ← qualquer nome descritivo               │
│                                                               │
│ Events *                                                     │
│ ☐ Insert      ← MARQUE                                      │
│ ☐ Update                                                     │
│ ☐ Delete                                                     │
│                                                               │
│ Object bucket *                                              │
│ [documentos] ← selecione seu bucket de PDFs                │
│                                                               │
│ HTTP Method *                                                │
│ [POST] ← deixar como está                                   │
│                                                               │
│ URI *                                                        │
│ [https://abcdef12345.supabase.co/functions/v1/process-document]
│                                                               │
│ Verify JWT                                                   │
│ ☑ ON (recomendado para segurança)                           │
│                                                               │
│ [Cancel] [Save webhook]                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Passo 5: Valores Exatos para Cada Campo

| Campo | Valor | Notas |
|-------|-------|-------|
| **Name** | `ProcessDocuments` | Ou qualquer nome que desejar |
| **Events** | ✅ **Insert** | Desmarque Update e Delete |
| **Object bucket** | `documentos` | Deve existir previamente |
| **HTTP Method** | `POST` | Fixo, não mude |
| **URI** | `https://seu-project-ref.supabase.co/functions/v1/process-document` | Veja como obter abaixo |
| **Verify JWT** | ✅ **Ligado** | Adiciona segurança |

#### 🔍 Como Obter a URI Correta

A URI deve estar no formato:
```
https://{project-ref}.supabase.co/functions/v1/process-document
```

**Encontrar seu `project-ref`:**

1. Na página do dashboard, copie da URL da barra de endereço
2. Exemplo: `https://app.supabase.com/project/{project-ref}/...`
3. Ou vá para **Settings** → **General** → **Project Ref**

**Exemplo completo:**
```
https://abcdefg1234567.supabase.co/functions/v1/process-document
```

#### Passo 6: Salvar

1. Clique no botão **[Save webhook]**
2. Você verá uma mensagem de sucesso: ✅ "Webhook created successfully"
3. O webhook agora aparecerá na lista

---

### Opção 2: Database Webhook (Alternativa)

Se preferir usar Webhooks de Banco (menos recomendado, mas funciona):

#### Via Painel

1. Vá para **Database** → **Webhooks**
2. Clique em **+ Create a new webhook**
3. Preencha:

| Campo | Valor |
|-------|-------|
| Name | `DocumentProcessing` |
| Table | `public.documentos` |
| Events | ✅ **INSERT** |
| Function | `process-document` |

#### Via SQL (SQL Editor)

```sql
-- Execute no SQL Editor do Supabase

-- Primeiro, verificar se a extensão HTTP está habilitada
CREATE EXTENSION IF NOT EXISTS http;

-- Criar a tabela de webhooks (se não existir)
-- Geralmente já existe, então podemos apenas inserir

-- Verificar webhooks existentes
SELECT * FROM supabase_functions.hooks;

-- Inserir novo webhook
INSERT INTO supabase_functions.hooks (
  id, 
  name, 
  function_name, 
  table_id, 
  events, 
  enabled
) 
VALUES (
  gen_random_uuid(),
  'process_document_webhook',
  'process-document',
  (SELECT id FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'documentos' LIMIT 1),
  ARRAY['INSERT'],
  true
);
```

---

## ✅ Testar o Webhook

Após criar o webhook, teste-o:

### Método 1: Upload via Painel

1. Vá para **Storage** → **documentos**
2. Clique em **Upload file**
3. Escolha um PDF teste
4. Aguarde 5-10 segundos

### Verificar se funcionou

1. Vá para **Functions** → **process-document** → **Logs**
2. Você deve ver uma entrada tipo:
   ```
   Processando arquivo: seu-arquivo.pdf do bucket: documentos
   Documento processado com sucesso. Status: valido
   ```

3. Ou vá para **SQL Editor** e execute:
   ```sql
   SELECT * FROM public.documentos 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
4. Você deve ver um novo registro com `status = 'valido'` ou `'expirado'`

---

## 🐛 Troubleshooting

### "Webhook criado, mas não funciona"

**Verificar:**

1. ✅ O bucket `documentos` existe?
   - **Storage** → procure por `documentos`
   - Se não existir, crie com: **+ New bucket** → nome: `documentos`

2. ✅ A função foi deployada?
   ```bash
   npx supabase functions list
   # Procure por: process-document
   ```

3. ✅ Verificar logs da função
   - Painel → **Functions** → **process-document** → **Logs**
   - Procure por mensagens de erro

4. ✅ Se tiver erro, verificar secret do webhook
   - Se `Verify JWT` está ligado, mas `WEBHOOK_SECRET` não foi configurado, desmarque temporariamente para testar

### "Authorization header do webhook não é válido"

**Causa:** Você configurou `WEBHOOK_SECRET` mas há erro no header

**Solução:**
```bash
# Verificar se o secret foi realmente salvo
npx supabase secrets list

# Se não aparecer, configurar novamente
npx supabase secrets set WEBHOOK_SECRET=sua-senha-aqui

# Se tiver código especial, use aspas
npx supabase secrets set WEBHOOK_SECRET="minha-senha-com-!@#"
```

### "Webhook retorna 500 (Internal Server Error)"

**Causa:** Erro na Edge Function (geralmente na análise de IA)

**Verificar:**
1. Logs da função (como acima)
2. Se `AI_API_KEY` está configurada:
   ```bash
   npx supabase secrets list
   ```
3. Se a chave é válida (testar com a API da Anthropic)

### "Webhook retorna 401 (Unauthorized)"

**Causa:** JWT inválido

**Solução:**
1. No painel, vá para webhook e desmarque **Verify JWT** para teste
2. Ou configure o `WEBHOOK_SECRET` corretamente

---

## 📋 Checklist - Antes de Fazer Upload de PDF

- [ ] ✅ Bucket `documentos` criado
- [ ] ✅ Tabela `documentos` existe com todas as colunas
- [ ] ✅ Edge Function `process-document` deployada
- [ ] ✅ `AI_API_KEY` configurada com chave válida da Anthropic
- [ ] ✅ Webhook criado apontando para a função
- [ ] ✅ Webhook com evento **INSERT** ligado
- [ ] ✅ **Verify JWT** ativado (ou secret configurado)

---

## 🎯 Fluxo Completo Passo-a-Passo

```
1. Usuário faz upload de PDF
   ↓
2. Supabase dispara webhook (POST)
   ↓
3. Edge Function recebe POST
   ↓
4. Valida JWT/secret
   ↓
5. Verifica se é INSERT no bucket "documentos" e é PDF
   ↓
6. Cria cliente Supabase service-role
   ↓
7. Baixa PDF do Storage
   ↓
8. Converte para Base64
   ↓
9. Envia para Claude API (Anthropic)
   ↓
10. Claude analisa e retorna JSON
    {
      "nome_documento": "Contrato de Serviços",
      "data_vencimento": "2027-03-25"
    }
   ↓
11. Edge Function calcula status
    (valido se data >= hoje, expirado se data < hoje)
   ↓
12. Atualiza tabela `documentos` com os dados
   ↓
13. Retorna JSON com status 200
   ↓
✅ Pronto! Seu frontend já pode consultar os dados
```

---

## 📞 Referências Rápidas

- [Dashboard Supabase](https://dashboard.supabase.com)
- [Documentação Webhooks](https://supabase.com/docs/guides/webhooks)
- [Documentação Storage](https://supabase.com/docs/guides/storage)
- [Documentação Edge Functions](https://supabase.com/docs/guides/functions)
