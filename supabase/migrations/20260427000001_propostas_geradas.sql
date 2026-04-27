create table if not exists propostas_geradas (
  id          uuid primary key default gen_random_uuid(),
  licitacao_id uuid not null references licitacoes(id) on delete cascade,
  company_id   uuid not null references companies(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  proposta_texto text not null,
  created_at   timestamptz not null default now()
);

alter table propostas_geradas enable row level security;

create policy "usuarios veem suas propostas"
  on propostas_geradas for select
  using (auth.uid() = user_id);

create policy "usuarios inserem suas propostas"
  on propostas_geradas for insert
  with check (auth.uid() = user_id);

create index propostas_geradas_user_idx on propostas_geradas(user_id);
create index propostas_geradas_licitacao_idx on propostas_geradas(licitacao_id);
