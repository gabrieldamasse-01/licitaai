-- Adiciona portal ComprasNet (SIASG/Compras.gov.br) à tabela portal_config
insert into portal_config (portal, ativo) values
  ('comprasnet', false)
on conflict (portal) do nothing;
