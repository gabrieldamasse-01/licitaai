-- Tabela de configuração de portais de dados (Effecti, PNCP)
-- Gerenciada apenas pelo admin via painel /admin

create table if not exists portal_config (
  portal      text        primary key,
  ativo       boolean     not null default false,
  updated_at  timestamptz not null default now()
);

-- Valores padrão: Effecti ativo, PNCP inativo
insert into portal_config (portal, ativo) values
  ('effecti', true),
  ('pncp',    false)
on conflict (portal) do nothing;

-- RLS habilitado sem policies → apenas service_role tem acesso
alter table portal_config enable row level security;
