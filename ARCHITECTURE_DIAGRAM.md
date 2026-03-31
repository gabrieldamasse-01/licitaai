# 📐 Diagramas de Arquitetura - LicitaAI PDF Processing

## 🏗️ Arquitetura Completa

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        FRONTEND LAYER                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                               ┃
┃   • Upload Component     • Document List    • Filters        ┃
┃   • Dashboard           • Status Display    • Alerts         ┃
┃                                                               ┃
┃                        React/Next.js                          ┃
┃                    (seus componentes)                         ┃
┃                                                               ┃
┗━━━┬━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    │
    ├─────────────────────────────────────────────────┐
    │                                                 │
    ▼                                                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                STORAGE LAYER                        │   │
│  │  Bucket: "documentos" (PDFs uploaded)             │   │
│  └──────────────────────────────────────────────────────┘   │
│            │                                                  │
│            │ (File.INSERT event)                            │
│            ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WEBHOOK TRIGGER                        │   │
│  │  Event: INSERT  POST /functions/v1/process-document│   │
│  └──────┬─────────────────────────────────────────────┘   │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          EDGE FUNCTION (Deno Runtime)              │   │
│  │  /functions/process-document                       │   │
│  │                                                      │   │
│  │  1. Validar webhook                                │   │
│  │  2. Baixar PDF do Storage                          │   │
│  │  3. Converter para Base64                          │   │
│  │  4. Enviar para Claude API                         │   │
│  │  5. Receber análise (JSON)                         │   │
│  │  6. Calcular status (válido/expirado)             │   │
│  │  7. UPDATE na tabela documentos                    │   │
│  └──────┬─────────────────────────────────────────────┘   │
│         │                                                    │
│         ├─────────────────────────────┐                     │
│         │                             │                     │
│         ▼                             ▼                     │
│  ┌────────────────────────┐   ┌──────────────────────────┐  │
│  │  DATABASE              │   │  EXTERNAL API            │  │
│  │  Table: documentos     │   │  Anthropic Claude        │  │
│  │                        │   │  (AI Analysis)           │  │
│  │ • id (UUID)            │   │                          │  │
│  │ • nome_arquivo         │   │ Model: claude-sonnet-4-6 │  │
│  │ • nome_documento ✓     │   │ Max tokens: 256          │  │
│  │ • data_vencimento ✓    │   └──────────────────────────┘  │
│  │ • status ✓             │                                 │
│  │ • processado_em ✓      │                                 │
│  └────────────────────────┘                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
    │
    │ (Consulta/Subscribe)
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│              FRONTEND (Atualização em Tempo Real)            │
│                                                              │
│  Supabase Realtime Subscriptions                            │
│  ├─ Novo documento criado                                   │
│  ├─ Status atualizado (pendente → válido/expirado)         │
│  └─ Alertas de vencimento                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados Passo-a-Passo

```
1. USER ACTION
   ↓
   [Upload PDF] → Browser → Supabase Client
   
2. STORAGE
   ↓
   supabase.storage.from('documentos').upload('file.pdf')
   ✓ File stored in bucket
   ✓ Webhook triggered (automatic)

3. WEBHOOK DELIVERY
   ↓
   Supabase sends POST to:
   https://seu-project.supabase.co/functions/v1/process-document
   
   Headers:
   - Authorization: Bearer (JWT)
   - Content-Type: application/json
   
   Body: {
     "type": "INSERT",
     "record": {
       "bucket_id": "documentos",
       "name": "file.pdf",
       ...
     }
   }

4. EDGE FUNCTION - VALIDATION
   ↓
   ✓ Check method = POST
   ✓ Verify JWT token
   ✓ Parse JSON
   ✓ Check event type = INSERT
   ✓ Check bucket = "documentos"
   ✓ Check file = *.pdf

5. EDGE FUNCTION - PDF DOWNLOAD
   ↓
   supabase.storage.from('documentos')
     .download('file.pdf')
   ✓ Get ArrayBuffer

6. EDGE FUNCTION - PREPARE
   ↓
   const pdfBase64 = btoa(...)
   ✓ Convert to Base64

7. EXTERNAL API - ANTHROPIC
   ↓
   POST https://api.anthropic.com/v1/messages
   
   {
     "model": "claude-sonnet-4-6",
     "messages": [
       {
         "role": "user",
         "content": [
           {
             "type": "document",
             "source": { "type": "base64", "data": "..." }
           },
           {
             "type": "text",
             "text": "Analyze this PDF and return JSON with..."
           }
         ]
       }
     ]
   }

8. EXTERNAL API - RESPONSE (Claude)
   ↓
   {
     "nome_documento": "Contrato de Serviços",
     "data_vencimento": "2027-06-30"
   }

9. EDGE FUNCTION - PROCESS RESPONSE
   ↓
   ✓ Extract JSON from response
   ✓ Validate fields
   ✓ Validate date format (YYYY-MM-DD)
   ✓ Calculate status:
     - IF date >= today → "valido"
     - IF date < today  → "expirado"

10. EDGE FUNCTION - DATABASE UPDATE
    ↓
    UPDATE public.documentos SET
      nome_documento = '...',
      data_vencimento = '...',
      status = '...',
      processado_em = NOW()
    WHERE url = '...' OR nome_arquivo = '...'

11. DATABASE - RESPONSE
    ↓
    ✓ Records updated: 1
    ✓ RLS policies applied
    ✓ Triggers fire
    ✓ Realtime broadcasts

12. FRONTEND - REALTIME UPDATE
    ↓
    Supabase Realtime subscription
    ✓ Document added to list
    ✓ Status displayed
    ✓ Alerts shown
    
    EXEMPLO:
    ┌─────────────────────────────┐
    │ 📄 Contrato de Serviços     │
    │ ✅ Válido                    │
    │ Vencimento: 30/06/2027      │
    └─────────────────────────────┘

13. END
    ✓ User sees processed document
    ✓ PDF is analyzed
    ✓ Metadata extracted
    ✓ Status calculated
    ✓ Database updated
    ✓ Frontend updated in real-time
```

---

## 🗂️ Estrutura de Arquivos - Visão Completa

```
c:\Users\Pichau\LicitaAI\
│
├── 📁 app/
│   ├── layout.tsx           ← Layout principal
│   ├── page.tsx             ← Home page
│   ├── 📁 auth/             ← Autenticação
│   ├── 📁 protected/        ← Páginas protegidas
│   └── globals.css          ← Estilos globais
│
├── 📁 components/
│   ├── 📁 ui/               ← Componentes de UI (badge, button, etc)
│   ├── 📁 tutorial/         ← Tutorial
│   ├── *-form.tsx           ← Formulários
│   ├── *-button.tsx         ← Botões
│   └── ...
│
├── 📁 lib/
│   ├── utils.ts             ← Utilitários
│   └── 📁 supabase/         ← Clientes Supabase
│       ├── client.ts        ← Browser client
│       ├── server.ts        ← Server client
│       └── proxy.ts         ← Proxy
│
├── 📁 supabase/             ← 🔥 NOVO - Configuração Supabase
│   ├── config.toml          ← Configuração local
│   ├── 📁 functions/        ← 🔥 Edge Functions
│   │   └── 📁 process-document/
│   │       └── index.ts     ← 🔥 FUNÇÃO PRINCIPAL
│   └── 📁 migrations/       ← 🔥 Migrações SQL
│       └── 20260325000000_documentos_processing_fields.sql
│
├── 📁 .next/                ← Build Next.js
├── 📁 node_modules/         ← Dependências
│
├── 🔥 DOCUMENTAÇÃO CRIADA:
│   ├── SUMMARY.md                           ← LEIA PRIMEIRO (2 min)
│   ├── QUICK_START_GUIDE.md                 ← Comandos rápidos
│   ├── DEPLOYMENT_EDGE_FUNCTION.md          ← Deploy detalhado
│   ├── WEBHOOK_SETUP_GUIDE.md               ← Como criar webhook
│   ├── EDGE_FUNCTION_TECHNICAL_DOCS.md      ← Deep dive técnico
│   ├── FRONTEND_EXAMPLES.md                 ← Código React prontos
│   ├── COMPLETE_CHECKLIST.md                ← Acompanhamento
│   └── ARCHITECTURE_DIAGRAM.md              ← Este arquivo
│
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
├── postcss.config.mjs
├── vercel.json
└── README.md
```

---

## 🔐 Segurança - Fluxo de Autenticação

```
REQUEST → Webhook
  │
  ├─ Authorization Header
  │  └─ Bearer {JWT_TOKEN}
  │
  ├─ JWT Verification (opcional)
  │  └─ Se WEBHOOK_SECRET configurada
  │     ├─ Extrai Bearer token
  │     ├─ Valida contra WEBHOOK_SECRET
  │     └─ Rejeita com 401 se inválido
  │
  ├─ Database Operations (RLS via service-role)
  │  └─ service_role_key (full access)
  │     ├─ Ignora RLS policies
  │     └─ Pode atualizar qualquer registro
  │
  └─ Edge Function Logs
     └─ Todos acionados com variáveis de ambiente seguras
```

---

## 📊 Estado da Tabela - Ciclo de Vida do Documento

```
DOCUMENTO LIFECYCLE:

1. UPLOAD
   status = 'pendente'
   nome_documento = NULL
   data_vencimento = NULL
   processado_em = NULL
   ├─ Webhook dispara
   └─ Edge Function começa

2. PROCESSING
   status = 'pendente'
   (Função rodando...)
   ├─ Baixando PDF
   ├─ Enviando para Claude
   └─ Aguardando resposta

3. AI ANALYSIS
   (Claude respondendo...)
   ├─ Extraindo nome
   ├─ Extraindo data
   └─ Validando JSON

4. POST-PROCESSING
   status = 'pendente' → 'valido' OU 'expirado'
   nome_documento = "Contrato de Vendas"
   data_vencimento = "2027-06-30"
   processado_em = NOW()
   ├─ Calcula data hoje
   └─ Compara vencimento

5. STORED
   ✅ FINAL STATE
   status = 'valido' (se data >= hoje)
   status = 'expirado' (se data < hoje)
   Nome documento: _______________
   Data vencimento: _______________
```

---

## ⚙️ Configuração de Variáveis

```
EDGE FUNCTION ENVIRONMENT:

┌─ AUTOMÁTICA (Supabase fornece)
│  ├─ SUPABASE_URL
│  │  └─ https://{project-ref}.supabase.co
│  │
│  └─ SUPABASE_SERVICE_ROLE_KEY
│     └─ eyJhbGc... (long string)
│
└─ MANUAL (Você configura)
   ├─ AI_API_KEY ⭐ OBRIGATÓRIA
   │  └─ sk-ant-... (da Anthropic)
   │
   └─ WEBHOOK_SECRET (opcional, recomendado)
      └─ sua-senha-aleatoria-super-secreta

COMO CONFIGURAR:
$ npx supabase secrets set AI_API_KEY=sk-ant-...
$ npx supabase secrets set WEBHOOK_SECRET=...

VERIFICAR:
$ npx supabase secrets list
```

---

## 🎯 Fluxo de Decisão - Qual Status?

```
            PDF ANALISADO
                  │
                  ▼
          DATA VENCIMENTO EXTRAÍDA
                  │
                  ├─────────────────────┐
                  │                     │
                  ▼                     ▼
          DATA INVÁLIDA         DATA VÁLIDA
                  │                     │
                  └─────────┬───────────┘
                            │
                            ▼
                        COMPARAR COM HOJE
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
            VENCIDO       HOJE      NÃO VENCIDO
                │           │           │
                ▼           ▼           ▼
            ❌ EXPIRADO  ✅ VÁLIDO  ✅ VÁLIDO
                │           │           │
                └─────┬─────┴─────┬─────┘
                      │           │
                      ▼           ▼
                    UPDATE DATABASE
                    status = 'expirado' OU 'valido'
```

---

## 🚨 Error Handling - Árvore de Decisão

```
REQUEST RECEIVED
    │
    ├─ POST? ✗ → 405 Method Not Allowed
    │
    ├─ JWT válido? ✗ → 401 Unauthorized
    │
    ├─ JSON válido? ✗ → 400 Bad Request
    │
    ├─ Event type = INSERT? ✗ → 200 OK (ignore)
    │
    ├─ Bucket = "documentos"? ✗ → 200 OK (ignore)
    │
    ├─ File = *.pdf? ✗ → 200 OK (ignore)
    │
    ├─ PDF download OK? ✗ → 500 Error
    │
    ├─ AI_API_KEY configurada? ✗ → 500 Error
    │
    ├─ Claude API OK? ✗ → 500 Error
    │
    ├─ JSON response OK? ✗ → 500 Error
    │
    ├─ Database UPDATE OK? ✗ → 500 Error
    │
    └─ ✅ SUCCESS → 200 OK
        └─ Retornar: {success, arquivo, nome_documento, ...}
```

---

## 📡 Webhook Payload - Estrutura

```
POST https://seu-project.supabase.co/functions/v1/process-document

HEADERS:
├─ Content-Type: application/json
├─ Authorization: Bearer eyJhbGc... (JWT)
└─ X-Supabase-Event-Signature: sha256=...

BODY:
{
  "type": "INSERT",                    ← Tipo de evento
  "table": "storage.objects",          ← Tabela
  "schema": "storage",                 ← Schema
  "record": {                          ← Registro criado
    "id": "uuid-do-arquivo",
    "bucket_id": "documentos",         ← BROWSER BUCKET
    "name": "pasta/arquivo.pdf",       ← NOME DO ARQUIVO
    "owner": "uuid-do-usuario",
    "created_at": "2026-03-25T10:00:00Z",
    "updated_at": "2026-03-25T10:00:00Z",
    "last_accessed_at": "2026-03-25T10:00:00Z",
    "metadata": {}
  },
  "old_record": null
}

RESPONSE (200 OK):
{
  "success": true,
  "arquivo": "pasta/arquivo.pdf",
  "nome_documento": "Contrato de Serviços",
  "data_vencimento": "2027-06-30",
  "status": "valido",
  "registros_atualizados": 1
}
```

---

## 🔗 Integração Frontend - Fluxo de Dados

```
FRONTEND
  │
  ├─ 1. Upload Component
  │   └─ supabase.storage.upload('documentos', file)
  │       └─ Webhook dispara automaticamente
  │
  ├─ 2. DocumentList Component
  │   └─ useDocumentos hook
  │       ├─ supabase.from('documentos').select()
  │       └─ supabase.on('*', ...).subscribe()  ← Real-time
  │
  ├─ 3. VencimentoAlertas Component
  │   └─ useDocumentosComVencimento hook
  │       ├─ Filtra por data
  │       └─ Mostra alertas
  │
  └─ 4. Status Filter
      └─ Agrupa por: pendente, valido, expirado

RESULTADO:
Dashboard atualizado em tempo real ✨
```

---

**Criado em:** 25 de Março de 2026
