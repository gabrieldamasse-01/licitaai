
# LicitaAI — Instruções para Claude Code

## Modelos
- Planejamento/análise/QA: `claude-opus-4-6` (você, agora)
- Implementação: subagente `executor` (`claude-sonnet-4-6`)
- Leitura de bases de código grandes / múltiplos arquivos: **Gemini CLI** (ver seção abaixo)

## Fluxo obrigatório
1. Tarefas simples → implementar direto com Sonnet via subagente executor
2. Tarefas complexas → planejar com Opus → delegar ao executor → verificar com fiscal-qa
3. Leitura/análise de codebase grande → usar Gemini CLI antes de implementar

## Quando usar o Gemini CLI
Use `gemini -p` sempre que:
- Precisar analisar diretórios grandes (>100KB total)
- Verificar se um padrão/feature já foi implementado no projeto
- Entender arquitetura geral antes de uma refatoração
- Comparar múltiplos arquivos grandes ao mesmo tempo
- A janela de contexto do Claude for insuficiente para a tarefa

### Comandos prontos para o projeto

> **Modelo atual:** `gemini-2.5-pro` (usar flag `--model gemini-2.5-pro`)

```bash
# Visão geral do projeto
gemini --model gemini-2.5-pro -p "@licitaai-next/ Me dê uma visão geral da arquitetura"

# Verificar se feature já existe
gemini --model gemini-2.5-pro -p "@licitaai-next/app/ @licitaai-next/components/ O empty state foi implementado? Mostre arquivos relevantes"

# Antes de mexer em autenticação
gemini --model gemini-2.5-pro -p "@licitaai-next/app/ @licitaai-next/lib/ Como está implementada a autenticação? Liste todos os arquivos relacionados"

# Antes de mexer em RLS/Supabase
gemini --model gemini-2.5-pro -p "@licitaai-next/supabase/ Liste todas as políticas RLS implementadas por tabela"

# Verificar padrões de erro/loading
gemini --model gemini-2.5-pro -p "@licitaai-next/app/ @licitaai-next/components/ Existem skeleton loaders ou loading states implementados? Liste-os"

# Análise de segurança antes de deploy
gemini --model gemini-2.5-pro -p "@licitaai-next/app/ @licitaai-next/lib/ Há endpoints de API sem validação de entrada? Mostre exemplos"

# Verificar integração com Effecti/PNCP
gemini --model gemini-2.5-pro -p "@licitaai-next/lib/ @licitaai-next/app/api/ Como está implementada a integração com Effecti e PNCP? Liste os endpoints e funções"
```

> **Nota:** rodar os comandos gemini de `C:\Users\Pichau\LicitaAI` (raiz do projeto)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| IA | Claude API — `claude-sonnet-4-6` |
| Email | Resend |
| Deploy | Vercel — branch `beta` |

## Repositório e deploy
- Repo: `gabrieldamasse-01/licitaai` → subfolder `licitaai-next`
- **Deploy correto: `git push origin beta`** — Vercel monitora branch `beta` e atualiza `licitaai-next.vercel.app` automaticamente
- Deploy manual (quando necessário) — rodar em sequência da raiz `C:\Users\Pichau\LicitaAI`:
  1. `npx vercel deploy --prod` — anotar a URL do deploy gerada (ex: `licitaai-next-abc123.vercel.app`)
  2. `npx vercel alias <URL-gerada> licitaai-next.vercel.app` — restaurar alias fixo
- Sync: `cd licitaai-next && npm run sync`
- CRON_SECRET: `licitaai-cron-2026`

## Estrutura de pastas
```
licitaai-next/
├── app/
│   ├── (auth)/             # login, signup, callback
│   ├── (dashboard)/        # rotas autenticadas
│   └── api/                # route handlers + crons
├── components/             # shadcn/ui + customizados
├── lib/
│   ├── supabase/           # server.ts, client.ts
│   └── utils.ts
├── supabase/
│   ├── migrations/
│   └── schema_completo.sql
└── .claude/agents/         # subagentes especializados
```

## Tabelas principais
- `companies` — empresas clientes
- `documents` / `document_types` — habilitação
- `licitacoes` — licitações Effecti + PNCP
- `matches` — empresa × licitação (scoring CNAE)
- `edital_analyses` — análise IA de editais
- `user_preferences` — configurações do usuário
- `agent_logs` / `api_usage` — logs e custo

## Portais integrados
- **Effecti** — funcional, cron 3x/dia (6h/12h/18h BRT)
- **PNCP** — funcional, cron 3x/dia
- BNC, BLL, Licitações-e, Licitar Digital — pendentes

## Agentes disponíveis
- `executor` — implementação (Sonnet)
- `fiscal-qa` — revisão crítica (Opus)
- `db-architect` — tabelas, RLS, tipos
- `claude-api-integrator` — análise de editais
- `scraping-agent` — coleta PNCP/Effecti
- `comms-agent` — alertas email/WhatsApp

## Regras obrigatórias
- SEMPRE rodar `fiscal-qa` após implementações
- SEMPRE rodar `tsc --noEmit` antes de commitar
- NUNCA fazer deploy sem build limpo
- NUNCA criar tabelas sem RLS (DROP + CREATE, nunca IF NOT EXISTS)
- NUNCA bypassar RLS no frontend
- Commits em português: `feat:` / `fix:` / `chore:`
- Variáveis públicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Variáveis secretas (só server): `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`

## Idioma
Sempre responder em **português brasileiro**.
