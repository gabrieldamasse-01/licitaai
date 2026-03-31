# LicitaAI — Contexto do Projeto

## O que é

Plataforma SaaS de assessoria em licitações públicas brasileiras. Monitora editais do PNCP, analisa documentos de habilitação, faz matching empresa × licitação e alerta sobre vencimentos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, Edge Functions, Storage) |
| IA | Claude API — modelo `claude-sonnet-4-6` |
| Scraping | Firecrawl API |
| Email | Resend |
| Deploy | Vercel (frontend) + Supabase Cloud |

## Repositório

https://github.com/gabrieldamasse-01/licitaai-dashboard-24

## Estado atual

- Projeto Next.js criado com template `with-supabase`
- Supabase conectado (`.env.local` configurado)
- Schema SQL ainda **não rodado** — arquivo em `supabase/schema_completo.sql`
- Auth, UI e integrações ainda não implementados

## Próximos passos

1. Rodar `supabase/schema_completo.sql` no Supabase
2. Implementar autenticação (já vem no template)
3. Construir dashboard principal
4. Implementar Edge Functions (scraping PNCP, análise IA, matching, alertas)

## Estrutura de pastas

```
licitaai-next/
├── app/
│   ├── (auth)/             # login, signup, callback
│   ├── (dashboard)/        # rotas autenticadas
│   └── api/                # route handlers
├── components/             # componentes shadcn/ui + customizados
├── lib/
│   ├── supabase/           # server.ts, client.ts, middleware.ts
│   └── utils.ts
├── supabase/
│   ├── functions/          # Edge Functions
│   ├── migrations/         # migrations versionadas
│   └── schema_completo.sql # schema inicial
└── .claude/agents/         # sub-agentes especializados
```

## Tabelas principais

- `companies` — empresas clientes da plataforma
- `document_types` — tipos de documento de habilitação
- `documents` — documentos enviados pelas empresas
- `licitacoes` — licitações coletadas do PNCP
- `matches` — matching empresa × licitação
- `edital_analyses` — análise IA de editais
- `agent_logs` — logs dos agentes automatizados
- `api_usage` — controle de custo da Claude API

## Convenções

- TypeScript estrito — sem `any`
- Server Components por padrão; `"use client"` apenas quando necessário
- Supabase Server Client no servidor, Browser Client no frontend
- RLS habilitado em todas as tabelas — nunca bypassar no frontend
- Variáveis públicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Variáveis secretas (só Edge Functions): `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `RESEND_API_KEY`

## Agentes disponíveis

- `.claude/agents/db-architect.md` — tabelas, RLS, tipos TypeScript
- `.claude/agents/claude-api-integrator.md` — análise de editais com Claude
- `.claude/agents/scraping-agent.md` — coleta PNCP + Firecrawl
- `.claude/agents/comms-agent.md` — alertas de vencimento + briefing semanal via Resend
- `.claude/agents/test-writer.md` — testes Vitest e Playwright

## Idioma

Sempre responder em **português brasileiro**.
