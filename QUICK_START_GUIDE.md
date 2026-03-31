# 🚀 Resumo Executivo - Automação LicitaAI (Processar PDFs)

## 📌 O Que Foi Criado

Uma automação completa em **Supabase Edge Functions** (Deno + TypeScript) que:

1. **Escuta** quando um PDF é enviado ao Storage
2. **Analisa** o PDF com inteligência artificial (Claude 3.5 Sonnet)
3. **Extrai** informações estruturadas (nome do documento + data de vencimento)
4. **Atualiza** o banco de dados com status (válido/expirado)

---

## 📋 Estrutura de Arquivos

```
supabase/
├── functions/
│   └── process-document/
│       └── index.ts          ← Código completo da função
├── migrations/
│   └── 20260325000000_documentos_processing_fields.sql
└── config.toml

DEPLOYMENT_EDGE_FUNCTION.md  ← Comandos exatos de deployment
EDGE_FUNCTION_TECHNICAL_DOCS.md ← Documentação técnica
WEBHOOK_SETUP_GUIDE.md  ← Como criar webhook no painel
```

---

## ⚡ Comandos Rápidos (Copy & Paste)

### 1️⃣ Instalar Dependências

```bash
npm install supabase --save-dev
```

### 2️⃣ Linkar ao Projeto em Produção

```bash
# Substitua "seu-project-ref" pelo seu projeto
npx supabase link --project-ref seu-project-ref
```

👉 **Como obter `seu-project-ref`:**
- [dashboard.supabase.com](https://dashboard.supabase.com) → seu projeto
- URL do navegador: `app.supabase.com/project/{project-ref}/...`

### 3️⃣ Configurar Chave de IA (OBRIGATÓRIO)

```bash
# Obter chave em: https://console.anthropic.com → API Keys
npx supabase secrets set AI_API_KEY=sk-ant-seu-token-completo-aqui
```

### 4️⃣ Configurar Secret do Webhook (Recomendado)

```bash
# Gerar uma senha aleatória segura
npx supabase secrets set WEBHOOK_SECRET=sua-senha-aleatoria-aqui
```

**Para gerar no PowerShell:**
```powershell
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Minimum 0 -Maximum 256)}))
Write-Output $secret
# Copie o resultado e use no comando acima
```

### 5️⃣ Verificar Secrets Configuradas

```bash
npx supabase secrets list
```

Você deve ver algo como:
```
✓ AI_API_KEY
✓ WEBHOOK_SECRET
```

---

## 🚀 Deployment para Produção

### Fazer Deploy da Edge Function

```bash
npx supabase functions deploy process-document
```

Se sucesso, você verá:
```
✔ Function deployed successfully at:
  https://seu-project-ref.supabase.co/functions/v1/process-document
```

### Testar Função Localmente (Opcional)

```bash
npx supabase functions serve
```

Depois, em outro terminal:
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

## 🪝 Criar Webhook no Painel (Passos Principais)

### Via Painel Supabase (Recomendado)

1. [dashboard.supabase.com](https://dashboard.supabase.com) → seu projeto
2. **Storage** → procure por **Webhooks** na seção
3. **+ Create a new webhook**
4. Preencha:

```
Name: ProcessDocuments
Events: ☑ Insert (desmarque Update e Delete)
Object bucket: documentos
HTTP Method: POST
URI: https://seu-project-ref.supabase.co/functions/v1/process-document
Verify JWT: ☑ ON
```

5. **Save webhook**

✅ Pronto! O webhook está ativo.

---

## ✅ Fazer um Teste Completo

### 1. Criar um PDF de Teste (Exemplo)

Se não tiver um PDF:

```bash
# No PowerShell, crie um PDF simples
$text = @"
Contrato de Serviços
Emitido em: 2026-03-25
Vencimento: 2027-06-30
Partes: Empresa A e Empresa B
@"

# Salvar como texto (será usado como teste)
Set-Content -Path "teste.pdf" -Value $text -Encoding UTF8
```

### 2. Upload via Painel

1. [dashboard.supabase.com](https://dashboard.supabase.com) → **Storage** → **documentos**
2. **Upload file** → escolha seu PDF
3. Aguarde 10 segundos

### 3. Verificar Resultado

**Opção A: Ver Logs da Função**

- Painel → **Functions** → **process-document** → **Logs**
- Procure por mensagem tipo:
  ```
  ✓ Documento processado com sucesso. Status: valido
  ```

**Opção B: Consultar Banco de Dados**

```bash
# No SQL Editor do painel, execute:
SELECT * FROM public.documentos 
ORDER BY processado_em DESC 
LIMIT 1;
```

Você deve ver um resultado assim:

```sql
id              | uuid-aqui
created_at      | 2026-03-25T10:15:00Z
user_id         | seu-user-uuid
nome_arquivo    | teste.pdf
url             | https://seu-project.supabase.co/storage/v1/object/public/documentos/teste.pdf
nome_documento  | Contrato de Serviços
data_vencimento | 2027-06-30
status          | valido
processado_em   | 2026-03-25T10:15:05Z
```

✅ Sucesso! O webhook e a função estão funcionando.

---

## 📌 Estrutura de Dados

### Tabela: `public.documentos`

```sql
-- Já criada pela migração, mas aqui está a estrutura:

CREATE TABLE public.documentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  user_id         uuid REFERENCES auth.users(id),
  
  -- Dados do upload
  nome_arquivo    text NOT NULL,              -- "contrato.pdf"
  url             text NOT NULL,              -- URL pública
  
  -- Preenchidos pela Edge Function
  nome_documento  text,                       -- "Contrato de Serviços"
  data_vencimento date,                       -- "2027-06-30"
  status          text CHECK (status IN (     -- "valido", "expirado", "pendente"
    'pendente', 'valido', 'expirado'
  )) DEFAULT 'pendente',
  processado_em   timestamptz                 -- "2026-03-25T10:15:05Z"
);
```

### Bucket: `documentos`

- 📁 Nome: `documentos`
- 🔓 Público/Privado: Recomenda-se **Privado** com URLs assinadas
- 📄 Aceita: qualquer tipo de arquivo, mas função valida PNGs

---

## 🔑 Variáveis de Ambiente

| Variável | Obrigatória | Onde Configurar | Exemplo |
|----------|-------------|-----------------|---------|
| `SUPABASE_URL` | ✅ | Automática | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Automática | `eyJhb...` |
| `AI_API_KEY` | ✅ | `npx supabase secrets set` | `sk-ant-...` |
| `WEBHOOK_SECRET` | ❌ | `npx supabase secrets set` | `sua-senha` |

**Configuradas automaticamente pelo Supabase:**
- São fornecidas pela plataforma, você não precisa fazer nada

**Você precisa configurar:**
- `AI_API_KEY` (chave da Anthropic)
- `WEBHOOK_SECRET` (senha custom, opcional)

---

## 🎯 Fluxo Visual

```
┌───────────────────────┐
│    PDF Upload         │
│   no Storage          │
└───────────┬───────────┘
            │ (webhook dispara)
            ▼
┌───────────────────────────────────────┐
│   Edge Function (process-document)    │
│                                       │
│   1. Valida webhook                   │
│   2. Baixa PDF do Storage             │
│   3. Converte para Base64             │
│   4. Envia para Claude (Anthropic)    │
│   5. Recebe: {nome, data}             │
│   6. Calcula status                   │
│   7. Atualiza banco de dados          │
└───────────┬───────────────────────────┘
            │
            ▼
┌───────────────────────────┐
│  Tabela `documentos`      │
│  ✅ Registro atualizado   │
│  - nome_documento         │
│  - data_vencimento        │
│  - status (valido/expirado)
│  - processado_em          │
└───────────────────────────┘
                │
                ▼
┌───────────────────────────┐
│  Seu Frontend/App         │
│  Consult dados            │
│  Exibir ao usuário ✅     │
└───────────────────────────┘
```

---

## 🐛 Se Algo Não Funcionar

### Checklist de Troubleshooting

1. **Webhook não está sendo acionado**
   - [ ] Bucket `documentos` existe?
   - [ ] Webhook foi criado no painel?
   - [ ] Webhook tem evento `INSERT` marcado?

2. **Função executa mas retorna erro**
   - [ ] `AI_API_KEY` está configurada? (`npx supabase secrets list`)
   - [ ] Chave da Anthropic é válida?
   - [ ] Veja logs: Painel → Functions → process-document → Logs

3. **Banco de dados não foi atualizado**
   - [ ] Tabela `documentos` existe?
   - [ ] Não há erro RLS (Row Level Security)?
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` está disponível?

4. **Erro "Unauthorized" ou "401"**
   - [ ] Se `Verify JWT` está ligado, `WEBHOOK_SECRET` deve estar correto
   - [ ] Ou desmarque `Verify JWT` temporariamente para testar

Para debug completo, veja: [DEPLOYMENT_EDGE_FUNCTION.md](DEPLOYMENT_EDGE_FUNCTION.md#-troubleshooting)

---

## 📚 Mais Informações

- 📖 **Documentação Técnica**: [EDGE_FUNCTION_TECHNICAL_DOCS.md](EDGE_FUNCTION_TECHNICAL_DOCS.md)
- 🚀 **Deployment Completo**: [DEPLOYMENT_EDGE_FUNCTION.md](DEPLOYMENT_EDGE_FUNCTION.md)
- 🪝 **Configurar Webhooks**: [WEBHOOK_SETUP_GUIDE.md](WEBHOOK_SETUP_GUIDE.md)

---

## 🎁 Próximos Passos Recomendados

1. **Teste completo**: Siga os passos acima até ver o webhook funcionando
2. **Integração Frontend**: Crie uma página que exiba os documentos processados
3. **Melhorias**:
   - [ ] Notificações quando documento expira
   - [ ] Dashboard de documentos por status
   - [ ] Filtros por data de vencimento
   - [ ] Renovação automática de licenças

---

## 💡 Dicas Finais

- **Salvar comandos**: Copie os comandos de deployment para um arquivo local
- **Testar antes**: Use `npx supabase functions serve` para testar localmente
- **Monitorar logs**: Sempre verifique os logs quando algo não funcionar
- **Documentação**: Mantenha os PDFs de documentação abertos enquanto trabalha

---

## 📞 Suporte Rápido

Se tiver dúvidas:

1. Leia o arquivo correspondente:
   - Setup? → `DEPLOYMENT_EDGE_FUNCTION.md`
   - Código? → `EDGE_FUNCTION_TECHNICAL_DOCS.md`
   - Webhook? → `WEBHOOK_SETUP_GUIDE.md`

2. Veja logs na plataforma:
   - [dashboard.supabase.com](https://dashboard.supabase.com) → Functions → Logs

3. Consulte documentação:
   - [Supabase Docs](https://supabase.com/docs)
   - [Anthropic Docs](https://docs.anthropic.com)

---

**✅ Você está pronto para começar!** 🎉

Execute os comandos na seção "Comandos Rápidos" e siga o guia de teste. Boa sorte com o LicitaAI! 🚀
