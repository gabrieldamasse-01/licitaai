# LicitaAI — Contexto do Projeto

## Visão Geral

Plataforma SaaS de assessoria em licitações públicas brasileiras. Ajuda empresas a descobrir, analisar e participar de licitações relevantes no PNCP (Portal Nacional de Contratações Públicas), com análise de IA e gestão documental integrada.

## Repositório

- GitHub: https://github.com/gabrieldamasse-01/licitaai-dashboard-24
- Branch principal: `main`

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| IA | Claude API (claude-sonnet-4-6), com cache de prompt |
| Scraping | PNCP API oficial + Firecrawl para editais em PDF |
| Email | Resend (alertas de documentos e briefing semanal) |
| Testes | Vitest (unit/integration), Playwright (e2e) |

## Estrutura do Monorepo

```
LicitaAI/
├── licitaai-next/          # App Next.js principal
│   ├── app/                # App Router (layouts, pages, api routes)
│   ├── components/         # Componentes React (shadcn/ui base)
│   ├── lib/                # Clients: supabase, claude, firecrawl, resend
│   └── types/              # Tipos TypeScript gerados do schema
├── supabase/
│   ├── migrations/         # Migrações SQL versionadas
│   ├── functions/          # Edge Functions Deno
│   └── schema_completo.sql # Schema de referência completo
└── .claude/
    └── agents/             # Agentes especializados Claude Code
```

## Estado Atual (2026-03-31)

- [x] Projeto Next.js criado
- [x] Supabase conectado (credenciais em `.env.local`)
- [ ] Schema SQL ainda não rodado em produção
- [ ] Auth (Supabase Auth + middleware) não implementado
- [ ] UI principal não construída

## Próximos Passos

1. Rodar `supabase/schema_completo.sql` no projeto Supabase
2. Implementar auth: login/cadastro com Supabase Auth, middleware Next.js
3. Construir UI: dashboard, cadastro de empresa, gestão de documentos
4. Implementar scraping agent (PNCP API)
5. Implementar análise de editais com Claude API
6. Configurar alertas via Resend

## Variáveis de Ambiente Necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude API
ANTHROPIC_API_KEY=

# Firecrawl
FIRECRAWL_API_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@licitaai.com.br
```

## Convenções de Código

- **Linguagem**: TypeScript estrito (`strict: true`)
- **Componentes**: Server Components por padrão; `"use client"` apenas quando necessário
- **Estilo**: Tailwind CSS + variantes do shadcn/ui; sem CSS modules
- **Queries Supabase**: sempre tipadas com o tipo gerado (`Database` do `@supabase/supabase-js`)
- **Erros**: nunca silenciar; sempre logar em `agent_logs` operações de agente
- **Segurança**: RLS habilitado em todas as tabelas; nunca expor `SERVICE_ROLE_KEY` no cliente
- **Commits**: mensagens em inglês, convencional commits (`feat:`, `fix:`, `chore:`)

## Domínio do Negócio

- **PNCP**: Portal Nacional de Contratações Públicas — fonte oficial de licitações
- **Modalidades**: Pregão Eletrônico, Concorrência, Dispensa, Inexigibilidade, RDC, etc.
- **Documentos de habilitação**: CND, FGTS, CNDT, Balanço Patrimonial, Atestados Técnicos, etc.
- **Fluxo principal**: Empresa cadastra-se → define perfil (CNAE, UF, porte, valor) → sistema busca matches → IA analisa editais → alertas por email

## Agentes Disponíveis

| Agente | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| DB Architect | `.claude/agents/db-architect.md` | Schema Supabase, RLS, tipos TS |
| Claude API Integrator | `.claude/agents/claude-api-integrator.md` | Análise de editais com IA |
| Scraping Agent | `.claude/agents/scraping-agent.md` | Busca licitações no PNCP |
| Comms Agent | `.claude/agents/comms-agent.md` | Alertas email via Resend |
| Test Writer | `.claude/agents/test-writer.md` | Testes Vitest e Playwright |
