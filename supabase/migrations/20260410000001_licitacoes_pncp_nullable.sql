-- Torna as colunas PNCP-específicas nullable para permitir inserção de dados Effecti.
-- Essas colunas só fazem sentido para licitações vindas do PNCP; dados da Effecti
-- usam source_id como chave única em vez de numero_compra/ano_compra/sequencial_compra/cnpj_orgao.

ALTER TABLE public.licitacoes
  ALTER COLUMN numero_compra    DROP NOT NULL,
  ALTER COLUMN ano_compra       DROP NOT NULL,
  ALTER COLUMN sequencial_compra DROP NOT NULL,
  ALTER COLUMN cnpj_orgao       DROP NOT NULL;
