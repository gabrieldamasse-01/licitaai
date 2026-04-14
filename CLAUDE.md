# LicitaAI — Contexto do Projeto

## Visão Geral

Plataforma SaaS de assessoria em licitações públicas brasileiras. Ajuda empresas a descobrir, analisar e participar de licitações no PNCP (Portal Nacional de Contratações Públicas), com análise de IA, gestão documental e notificações integradas.

## Repositório

- GitHub: https://github.com/gabrieldamasse-01/licitaai-dashboard-24
- Branch principal: `main` (deploy via Vercel na branch `master`)
- URL de produção: https://licitaai-next.vercel.app

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15.3 App Router, TypeScript strict, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| IA | Claude API (claude-sonnet-4-6), prompt caching |
| Licitações | Effecti API (PNCP), Firecrawl para PDFs |
| Email | Resend — alertas e boas-vindas |
| Pagamentos | Stripe (plano Pro R$97/mês) |
| Testes | Vitest 4.1 |
| Deploy | Vercel (frontend) + Supabase Cloud |

---

## 📁 Mapa de Pastas (Navegação Rápida)

> **IMPORTANTE**: Use este mapa para ir direto ao arquivo correto. Não leia pastas inteiras.

### `licitaai-next/app/` — Páginas e Rotas

| Caminho | Arquivos | O que faz |
|---------|----------|-----------|
| `app/page.tsx` | Landing page pública |
| `app/layout.tsx` | Root layout, ThemeProvider |
| `app/(dashboard)/layout.tsx` | Layout autenticado c/ sidebar |
| `app/(dashboard)/dashboard/page.tsx` | Métricas, gráficos |
| `app/(dashboard)/clientes/page.tsx` | Lista de empresas |
| `app/(dashboard)/clientes/[id]/page.tsx` | Detalhe de empresa |
| `app/(dashboard)/documentos/page.tsx` | Lista de documentos |
| `app/(dashboard)/licitacoes/page.tsx` | Licitações Effecti |
| `app/(dashboard)/oportunidades/page.tsx` | Matching c/ scoring |
| `app/(dashboard)/configuracoes/page.tsx` | Perfil + plano Stripe |
| `app/(dashboard)/notificacoes/page.tsx` | Lista notificações |
| `app/(dashboard)/feedback/page.tsx` | Formulário feedback |
| `app/(dashboard)/admin/page.tsx` | Painel admin |
| `app/auth/login/page.tsx` | Tela de login |
| `app/auth/sign-up/page.tsx` | Tela de cadastro |
| `app/auth/forgot-password/page.tsx` | Recuperar senha |
| `app/auth/update-password/page.tsx` | Atualizar senha |
| `app/auth/verify-2fa/page.tsx` | Verificação 2FA |
| `app/onboarding/page.tsx` | Wizard cadastro empresa |

### `licitaai-next/app/api/` — API Routes (Backend)

| Caminho | Arquivos | O que faz |
|---------|----------|-----------|
| `api/stripe/checkout/route.ts` | Criar sessão Stripe |
| `api/stripe/webhook/route.ts` | Processar eventos Stripe |
| `api/cron/alertas/route.ts` | Cron diário de alertas |
| `api/cron/licitacoes/route.ts` | Sincronizar Effecti |
| `api/email/boas-vindas/route.ts` | Email de onboarding |
| `api/processar-edital/route.ts` | Webhook n8n |
| `api/auth/send-otp/route.ts` | Enviar código 2FA |
| `api/auth/verify-otp/route.ts` | Verificar código 2FA |
| `api/auth/check-2fa/route.ts` | Verificar se usuário tem 2FA |
| `api/admin/impersonate/route.ts` | Admin impersona cliente |
| `api/admin/stop-impersonate/route.ts` | Parar impersonação |
| `api/analisar-documento/route.ts` | Análise IA de documento |

### `licitaai-next/lib/` — Utilitários e Clients

| Arquivo | O que faz |
|---------|-----------|
| `supabase/client.ts` | Client Supabase para navegador |
| `supabase/server.ts` | Client Supabase para Server Components |
| `supabase/service.ts` | Service role (bypass RLS) |
| `supabase/proxy.ts` | Proxy para queries autenticadas |
| `stripe.ts` | Client Stripe lazy-loaded |
| `resend.ts` | Client Resend para emails |
| `effecti.ts` | API Effecti (licitações) |
| `scoring.ts` | Algoritmo de matching CNAE |
| `is-admin.ts` | Verificar se usuário é admin |
| `impersonation.ts` | Helpers de impersonação |
| `plans.ts` | Definições de planos gratuito/pro |
| `env.ts` | Validação de env vars |
| `pncp.ts` | API PNCP oficial |

### `licitaai-next/components/` — UI Components

| Pasta/Arquivo | O que faz |
|---------------|-----------|
| `ui/` | Componentes shadcn/ui (button, input, card, etc.) |
| `layout/app-sidebar.tsx` | Sidebar principal |
| `layout/mobile-header.tsx` | Header mobile |
| `layout/bottom-nav.tsx` | Navegação inferior mobile |
| `auth/login-form.tsx` | Formulário de login |
| `auth/sign-up-form.tsx` | Formulário de cadastro |
| `auth/forgot-password-form.tsx` | Formulário recuperar senha |
| `auth/update-password-form.tsx` | Formulário atualizar senha |
| `landing/landing-hero.tsx` | Hero da landing page |
| `landing/landing-cta.tsx` | Call-to-action landing |
| `landing/landing-planos.tsx` | Planos e preços |
| `landing/landing-beneficios.tsx` | Benefícios do produto |
| `landing/landing-como-funciona.tsx` | Explicação do fluxo |
| `landing/landing-depoimentos.tsx` | Depoimentos de clientes |
| `notifications-bell.tsx` | Sino c/ badge de não lidas |
| `upgrade-button.tsx` | Botão upgrade Stripe |
| `impersonation-banner.tsx` | Banner quando impersonando |
| `global-search.tsx` | Busca global |
| `configuracoes-client.tsx` | Cliente de configurações |
| `documentos-lista.tsx` | Lista de documentos |
| `domain/grafico-licitacoes.tsx` | Gráfico do dashboard |

### `supabase/migrations/` — Banco de Dados

| Migration | O que cria |
|-----------|-----------|
| `*_documentos_processing_fields.sql` | Campos de processamento |
| `*_licitacoes_e_agent_logs.sql` | Tabelas de licitações e logs |
| `*_licitacoes_analise_ia.sql` | Cache de análises IA |
| `*_clientes_e_matches.sql` | Tabelas de matching |
| `*_create_alert_logs.sql` | Logs de alertas |
| `*_user_preferences.sql` | Preferências do usuário |
| `*_feedback.sql` | Tabela de feedbacks |
| `*_notifications.sql` | Notificações + Realtime |
| `*_admin_users.sql` | Administradores |
| `*_storage_documentos_rls.sql` | RLS do bucket Storage |
| `*_otp_codes.sql` | Códigos 2FA |

### `.claude/agents/` — Sub-agentes

| Arquivo | Especialidade |
|---------|--------------|
| `db-architect.md` | Schema Supabase, RLS, migrations |
| `claude-api-integrator.md` | Claude API, prompt caching |
| `scraping-agent.md` | PNCP + Firecrawl |
| `comms-agent.md` | Emails via Resend |
| `test-writer.md` | Testes Vitest/Playwright |
| `critic.md` | Revisão adversarial |
| `context-engineer.md` | Arquivos mínimos |

---

## Features Implementadas (PRODUÇÃO)

- Auth completo: login, cadastro, magic link, 2FA com OTP
- Onboarding wizard (3 passos: empresa → CNAEs → sucesso)
- Dashboard com métricas e gráficos
- Gestão de clientes/empresas (multi-tenant)
- Gestão de documentos com upload Storage + alertas de vencimento
- Busca de oportunidades via Effecti API com scoring por CNAE
- Stripe Pro (R$97/mês) com checkout + webhook
- Cron diário de alertas de documentos vencendo (Resend)
- Notificações in-app com sino (Supabase Realtime)
- Painel /admin com 5 abas + impersonação de clientes
- Dark mode global + landing page pública

## Segurança Multi-tenant

**Regra de ouro**: toda query que lê ou escreve dados de empresa DEVE incluir filtro por `user_id` ou verificar ownership via join.

- RLS habilitado em todas as tabelas
- Server Actions sempre chamam `supabase.auth.getUser()` primeiro
- Service role (`createServiceClient`) apenas em Route Handlers e cron — nunca no cliente
- Admin master: `gabriel.damasse@mgnext.com`

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
FIRECRAWL_API_KEY=
EFFECTI_API_TOKEN=
RESEND_API_KEY=
EMAIL_FROM=alertas@licitaai.com.br
CRON_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_APP_URL=https://licitaai-next.vercel.app
N8N_WEBHOOK_URL=
```

## Convenções de Código

- **TypeScript strict** — sem `any`
- **Server Components por padrão** — `"use client"` apenas quando necessário
- **Tailwind dark mode** — via classe `.dark` no `<html>`
- **Commits** — conventional commits: `feat:`, `fix:`, `chore:`
- **Deploy** — `npx vercel deploy --prod` a partir do root

## Cron Jobs (vercel.json)

| Path | Schedule | Descrição |
|------|----------|-----------|
| `/api/cron/alertas` | `0 9 * * *` | Alertas de documentos vencendo |
| `/api/cron/licitacoes` | `0 9,15,21 * * *` | Sincronização Effecti (3x/dia) |

## Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `companies` | Empresas clientes (multi-tenant por `user_id`) |
| `clientes` | Perfil estendido com critérios de matching |
| `documents` | Documentos de habilitação |
| `licitacoes` | Licitações importadas (PNCP/Effecti) |
| `matches` | Matching empresa × licitação com score |
| `user_preferences` | Preferências + plano Stripe |
| `notifications` | Notificações in-app (Realtime) |
| `admin_users` | Administradores |

## Domínio do Negócio

- **PNCP**: Portal Nacional de Contratações Públicas — fonte oficial
- **Modalidades**: Pregão Eletrônico, Concorrência, Dispensa, Inexigibilidade, RDC
- **Documentos**: CND Federal/Estadual/Municipal, FGTS, CNDT, Contrato Social, Procuração
- **Fluxo**: Cadastro → Onboarding (empresa + CNAEs) → Dashboard → Oportunidades → Salvar → Analisar edital

## Integrações Pendentes

### Stripe — PENDENTE (André)

As variáveis `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` e `STRIPE_PRO_PRICE_ID` ainda **não estão configuradas** em produção. Aguardando André configurar a conta Stripe e fornecer as chaves. **Não alterar o código de pagamento** até confirmação dele.

---

## Agente Fiscal QA — Execução Automática

Após TODA tarefa que envolva criação ou edição de código (feat, fix, chore com mudanças em .ts ou .tsx):

1. Invocar automaticamente o agente fiscal: /agent fiscal-qa
2. O agente roda antes do commit final
3. Só fazer deploy após o agente confirmar build limpo

Exceções (não rodar o fiscal):
- Tarefas só de documentação (alterações apenas em .md)
- Alterações apenas em arquivos SQL de migration
- Tarefas de configuração sem código TypeScript