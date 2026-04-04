# LicitaAI — Contexto do Projeto

## Visão Geral

Plataforma SaaS de assessoria em licitações públicas brasileiras. Ajuda empresas a descobrir, analisar e participar de licitações relevantes no PNCP (Portal Nacional de Contratações Públicas), com análise de IA, gestão documental e notificações integradas.

## Repositório

- GitHub: https://github.com/gabrieldamasse-01/licitaai-dashboard-24
- Branch principal: `main` (deploy via Vercel na branch `master`)
- URL de produção: https://licitaai-next.vercel.app

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16.2 App Router, TypeScript strict, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| IA | Claude API (claude-sonnet-4-6), prompt caching |
| Scraping | PNCP API oficial + Firecrawl para editais em PDF |
| Email | Resend — alertas de documentos e email de boas-vindas |
| Pagamentos | Stripe (plano Pro R$97/mês) |
| Deploy | Vercel (frontend) + Supabase Cloud |

## Estrutura do Monorepo

```
LicitaAI/
├── licitaai-next/                  # App Next.js principal
│   ├── app/
│   │   ├── (dashboard)/            # Rotas autenticadas
│   │   │   ├── layout.tsx          # Layout c/ sidebar, beta banner, sino de notificações
│   │   │   ├── dashboard/          # Visão geral com métricas
│   │   │   ├── clientes/           # Gestão de empresas clientes
│   │   │   ├── documentos/         # Documentos de habilitação
│   │   │   ├── licitacoes/         # Busca de licitações PNCP
│   │   │   ├── oportunidades/      # Matching empresa × licitação
│   │   │   ├── relatorios/         # Relatórios e análises
│   │   │   ├── configuracoes/      # Perfil e plano (Stripe)
│   │   │   ├── feedback/           # Formulário de feedback beta
│   │   │   ├── notificacoes/       # Lista completa de notificações
│   │   │   └── admin/              # Painel admin (restrito)
│   │   ├── api/
│   │   │   ├── stripe/             # checkout + webhook
│   │   │   ├── email/boas-vindas/  # Email de boas-vindas onboarding
│   │   │   ├── processar-edital/   # Webhook para n8n
│   │   │   └── cron/alertas/       # Cron de alertas de documentos
│   │   ├── auth/                   # login, sign-up, forgot-password, etc.
│   │   └── onboarding/             # Wizard de cadastro de empresa
│   ├── components/
│   │   ├── layout/                 # app-sidebar, mobile-header, bottom-nav
│   │   ├── notifications-bell.tsx  # Sino com Realtime
│   │   ├── upgrade-button.tsx      # Botão Stripe checkout
│   │   └── ui/                     # shadcn/ui components
│   └── lib/
│       ├── supabase/               # server.ts, client.ts, service.ts
│       ├── stripe.ts               # lazy Stripe client
│       ├── resend.ts               # Resend client
│       ├── is-admin.ts             # Verificação de acesso admin
│       ├── effecti.ts              # API de licitações
│       └── scoring.ts              # Algoritmo de matching
├── supabase/migrations/            # SQL migrations versionadas
└── .claude/agents/                 # Sub-agentes especializados
```

## Estado Atual (2026-04-04) — PRODUÇÃO

### Features implementadas e no ar

- [x] Auth completo: login, cadastro, forgot-password, magic link
- [x] Onboarding wizard (3 passos: empresa → CNAEs → sucesso)
- [x] Dashboard com métricas: documentos, licitações, alertas
- [x] Gestão de clientes/empresas com multi-tenant seguro
- [x] Gestão de documentos com vencimento e alertas
- [x] Busca de oportunidades via Effecti API com scoring por CNAE
- [x] Saving de oportunidades em `matches`
- [x] Stripe Pro (R$97/mês) com checkout + webhook
- [x] Cron de alertas — email diário via Resend para documentos vencendo
- [x] Notificações in-app com sino (Supabase Realtime, badge de não lidas)
- [x] Página /notificacoes com filtros
- [x] Página /feedback (Bug/Sugestão/Elogio)
- [x] Banner beta + badge BETA na sidebar
- [x] Email de boas-vindas no onboarding
- [x] Painel /admin com 5 abas: Visão Geral, Clientes, Feedbacks, Licitações, Time
- [x] Sistema de admins via tabela admin_users
- [x] Dark mode global (classe `.dark` no html, ThemeProvider)
- [x] Landing page pública

### Migrations rodadas em produção (confirmar)
- `20260325000000_documentos_processing_fields.sql`
- `20260330000000_licitacoes_e_agent_logs.sql`
- `20260330000001_licitacoes_analise_ia.sql`
- `20260330000002_clientes_e_matches.sql`
- `20260402000000_create_alert_logs.sql`
- `20260403000001_user_preferences.sql`
- `20260403_stripe_fields.sql`

### Migrations pendentes (rodar no Supabase)
- `20260403000002_feedback.sql` — tabela feedback + RLS
- `20260403000003_notifications.sql` — tabela notifications + Realtime
- `20260404000001_admin_users.sql` — tabela admin_users + RLS
- `20260404000002_feedback_resolvido.sql` — coluna resolvido em feedback

## Segurança Multi-tenant

**Regra de ouro**: toda query que lê ou escreve dados de empresa DEVE incluir filtro por `user_id` ou verificar ownership via join.

- RLS habilitado em todas as tabelas
- Server Actions sempre chamam `supabase.auth.getUser()` primeiro
- Service role (`createServiceClient`) apenas em Route Handlers e cron — nunca no cliente
- Admin email master: `gabriel.damasse@mgnext.com`
- Outros admins: tabela `admin_users WHERE ativo = true`

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
FIRECRAWL_API_KEY=
RESEND_API_KEY=
EMAIL_FROM=alertas@licitaai.com.br
CRON_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_APP_URL=https://licitaai-next.vercel.app
```

## Convenções de Código

- **TypeScript strict** — sem `any`
- **Server Components por padrão** — `"use client"` apenas quando necessário
- **Tailwind dark mode** — via classe `.dark` no `<html>` (ThemeProvider defaultTheme="dark")
- **Commits** — conventional commits em inglês: `feat:`, `fix:`, `chore:`
- **Deploy** — sempre `npx vercel deploy --prod` a partir do root do monorepo
- **Erros Supabase** — nunca silenciar sem log; usar `?? []` e `?? 0` para fallbacks

## Domínio do Negócio

- **PNCP**: Portal Nacional de Contratações Públicas — fonte oficial
- **Modalidades**: Pregão Eletrônico, Concorrência, Dispensa, Inexigibilidade, RDC
- **Documentos**: CND Federal/Estadual/Municipal, FGTS, CNDT, Contrato Social, Procuração
- **Fluxo**: Cadastro → Onboarding (empresa + CNAEs) → Dashboard → Oportunidades → Salvar → Analisar edital

## Agentes Disponíveis

| Agente | Responsabilidade |
|--------|-----------------|
| `db-architect` | Schema Supabase, RLS, migrations, tipos TS |
| `claude-api-integrator` | Análise de editais com Claude API, prompt caching |
| `scraping-agent` | Busca licitações no PNCP + Firecrawl |
| `comms-agent` | Alertas de vencimento + email via Resend |
| `test-writer` | Testes Vitest e Playwright |
| `critic` | Revisão crítica adversarial — segurança, performance, bugs |
| `context-engineer` | Determina arquivos mínimos necessários para uma tarefa |

## Configuração Claude Code (`.claude/settings.json` global)

- **Auto-accept**: Read, Edit, Write, Bash(*), WebFetch, WebSearch, Agent, Glob, Grep
- **Som de conclusão**: beep duplo ao terminar tarefa longa
- **Status line**: `[dir]  [modelo]  ctx:[%]`
- **MCP Servers**: supabase (read-only), github, filesystem
- **Agent Teams**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
