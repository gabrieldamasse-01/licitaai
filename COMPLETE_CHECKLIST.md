# ✅ Checklist Completo - Automação LicitaAI (Processar PDFs)

## 📋 Status do Projeto

**Criado em:** 25 de Março de 2026  
**Versão:** 1.0  
**Status:** Pronto para Deployment

---

## 🎯 Fase 1: Setup Local (Completado)

- [x] Instalar Supabase CLI
- [x] Criar Edge Function `process-document`
- [x] Criar migração SQL para tabela `documentos`
- [x] Escrever código Deno/TypeScript completo
- [x] Integrar com Anthropic Claude API

**Status:** ✅ COMPLETO

---

## 🚀 Fase 2: Configuração em Produção (TODO)

### 2.1 - Linkar Projeto Supabase

- [ ] Obter `project-ref` do dashboard
- [ ] Executar: `npx supabase link --project-ref seu-project-ref`
- [ ] Confirmação: "Linked to project ..."

**Comandos:**
```bash
npx supabase link --project-ref seu-project-ref
```

**Valor de `project-ref`:**
```
___________________  ← Copie de dashboard.supabase.com
```

### 2.2 - Configurar API Keys

- [ ] Obter chave de API da Anthropic
  - URL: https://console.anthropic.com → API Keys

- [ ] Configurar `AI_API_KEY`
  ```bash
  npx supabase secrets set AI_API_KEY=sk-ant-...
  ```

- [ ] Configurar `WEBHOOK_SECRET` (opcional, mas recomendado)
  ```bash
  npx supabase secrets set WEBHOOK_SECRET=sua-senha-aleatoria
  ```

- [ ] Verificar secrets
  ```bash
  npx supabase secrets list
  ```

**Status de Secrets:**
- [ ] `AI_API_KEY` ✅
- [ ] `WEBHOOK_SECRET` ✅ (opcional)
- [ ] `SUPABASE_URL` ✅ (automática)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ✅ (automática)

### 2.3 - Deploy da Edge Function

- [ ] Executar deploy: `npx supabase functions deploy process-document`
- [ ] Confirmar URL de sucesso:
  ```
  https://seu-project-ref.supabase.co/functions/v1/process-document
  ```

**Comando:**
```bash
npx supabase functions deploy process-document
```

**URL Resultante:**
```
_________________________________  ← Copie da resposta
```

**Status:** `[ ] NOT STARTED | [ ] IN PROGRESS | [x] READY`

---

## 🪝 Fase 3: Configurar Webhook (TODO)

### 3.1 - Preparar

- [ ] Confirmar que bucket `documentos` existe
- [ ] Confirmar que tabela `documentos` existe
- [ ] Ter a URL da função em mãos (veja Fase 2.3)

### 3.2 - Criar Webhook no Painel

No dashboard.supabase.com:

- [ ] Ir para **Storage** → **Webhooks**
- [ ] Clique **+ Create a new webhook**
- [ ] Preencha com:

| Campo | Valor | Status |
|-------|-------|--------|
| **Name** | `ProcessDocuments` | [ ] ✓ |
| **Events** | ✅ **Insert** | [ ] ✓ |
| **Object bucket** | `documentos` | [ ] ✓ |
| **HTTP Method** | `POST` | [ ] ✓ |
| **URI** | `https://seu-project-ref...` | [ ] ✓ |
| **Verify JWT** | ✅ **ON** | [ ] ✓ |

- [ ] Clique **Save webhook**
- [ ] Confirmar mensagem de sucesso

**Página de Referência:** [WEBHOOK_SETUP_GUIDE.md](WEBHOOK_SETUP_GUIDE.md)

---

## 🧪 Fase 4: Teste Completo (TODO)

### 4.1 - Teste Manual (Opcional)

- [ ] Executar `npx supabase functions serve`
- [ ] Em outro terminal, executar teste cURL (veja QUICK_START_GUIDE.md)
- [ ] Confirmar resposta JSON com status 200

### 4.2 - Teste com PDF Real

- [ ] Ter um PDF pronto (pode ser um documento qualquer)
- [ ] Fazer upload em **Storage** → **documentos**
- [ ] Aguardar 10 segundos
- [ ] Verificar logs: **Functions** → **process-document** → **Logs**
  - [ ] Deve haver mensagem: "Documento processado com sucesso"
- [ ] Verificar banco de dados em **SQL Editor**:
  ```sql
  SELECT * FROM public.documentos 
  ORDER BY processado_em DESC LIMIT 1;
  ```
  - [ ] Deve ter registro com `nome_documento` preenchido
  - [ ] Deve ter `data_vencimento` em formato YYYY-MM-DD
  - [ ] Deve ter `status` como 'valido' ou 'expirado'

**Log Esperado:**
```
✓ Processando arquivo: seu-documento.pdf do bucket: documentos
✓ Documento processado com sucesso. Status: valido
```

**Registro Esperado no Banco:**
```
nome_documento: "Nome do Documento"
data_vencimento: "2027-06-30"
status: "valido"
processado_em: "2026-03-25T14:30:00Z"
```

---

## 🔧 Fase 5: Integração Frontend (PRÓXIMO)

- [ ] Criar página para listar documentos
- [ ] Exibir status (válido/expirado) com cores
- [ ] Filtrar por status
- [ ] Mostrar data de vencimento

**Componente Recomendado:**
- Usar `supabase-js` para consultar `public.documentos`
- Display com cores: Verde (válido), Amarelo (vencendo), Vermelho (expirado)

---

## 📊 Resumo de Status

```
┌─────────────────────────────────────────────────────────┐
│  Fase 1: Setup Local              [████████████] 100% ✅ │
│  Fase 2: Config em Produção       [           ] 0%   ❌ │
│  Fase 3: Webhook                  [           ] 0%   ❌ │
│  Fase 4: Teste                    [           ] 0%   ❌ │
│  Fase 5: Frontend                 [           ] 0%   ❌ │
└─────────────────────────────────────────────────────────┘

Status Geral: ⏳ Aguardando Configuração em Produção
```

---

## 💾 Arquivos Criados

| Arquivo | Propósito | Leia Quando |
|---------|-----------|-------------|
| `supabase/functions/process-document/index.ts` | Código da função | Precisar entender fluxo |
| `supabase/migrations/20260325000000_...sql` | Estrutura de BD | Precisar criar tabela |
| `QUICK_START_GUIDE.md` | Resumo com comandos | Primeiro! |
| `DEPLOYMENT_EDGE_FUNCTION.md` | Deployment completo | Configurando produção |
| `WEBHOOK_SETUP_GUIDE.md` | Como criar webhook | Criando webhook |
| `EDGE_FUNCTION_TECHNICAL_DOCS.md` | Documentação técnica | Entender detalhes |
| `COMPLETE_CHECKLIST.md` | Este arquivo | Rastrear progresso |

---

## 🎯 Próximos 3 Passos

### AGORA (5 minutos)

1. Abrir `QUICK_START_GUIDE.md`
2. Copiar comando de link do projeto:
   ```bash
   npx supabase link --project-ref seu-project-ref
   ```
3. Executar e confirmar

### DEPOIS (10 minutos)

1. Obter chave Anthropic em console.anthropic.com
2. Configurar `AI_API_KEY`:
   ```bash
   npx supabase secrets set AI_API_KEY=sk-ant-...
   ```
3. Fazer deploy:
   ```bash
   npx supabase functions deploy process-document
   ```

### POR FIM (10 minutos)

1. Criar webhook no painel (veja `WEBHOOK_SETUP_GUIDE.md`)
2. Fazer upload de PDF de teste
3. Verificar logs e banco de dados

**Tempo Total:** ≈ 25-30 minutos

---

## 🚨 Pontos de Atenção

- ⚠️ **Sem `AI_API_KEY`**, a função vai falhar
- ⚠️ **Sem webhook**, PDFs não serão processados automaticamente
- ⚠️ **Sem tabela `documentos`**, atualizações vão falhar
- ⚠️ **Webhook com "Insert" desmarcado**, função não será acionada

---

## 📞 Support Rápido

| Problema | Arquivo | Seção |
|----------|---------|-------|
| "Não sei como começar" | `QUICK_START_GUIDE.md` | Comandos Rápidos |
| "Webhook não ativa" | `WEBHOOK_SETUP_GUIDE.md` | Troubleshooting |
| "Erro na função" | `DEPLOYMENT_EDGE_FUNCTION.md` | Troubleshooting |
| "Quero entender código" | `EDGE_FUNCTION_TECHNICAL_DOCS.md` | Completo |

---

## ✨ Última Checagem

Antes de considerar COMPLETO:

- [ ] Webhook criado e ativo
- [ ] PDF enviado e processado
- [ ] Banco de dados atualizado com informações da IA
- [ ] Status mostrado corretamente (válido/expirado)
- [ ] Logs demonstram execução bem-sucedida

---

## 🎉 Celebrar!

Quando tudo estiver funcionando:

- ✅ LicitaAI tem automação de análise de PDFs
- ✅ Edge Functions rodando em produção
- ✅ Integração com Claude/Anthropic
- ✅ Dados estruturados no banco de dados

**Parabéns!** 🚀

---

## 📝 Notas Pessoais

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Documento atualizado em:** 25 de Março de 2026  
**Próxima revisão:** Após primeiro deploymenTeste com sucesso
