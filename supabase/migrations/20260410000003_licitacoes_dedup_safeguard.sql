-- Migration: 20260410000003_licitacoes_dedup_safeguard.sql
-- Proteção preventiva contra licitações duplicadas
--
-- Contexto:
--   - source_id TEXT UNIQUE existe, mas UNIQUE não bloqueia múltiplos NULLs no Postgres
--   - Registros PNCP legados com source_id = NULL podem acumular duplicatas
--   - source_id vazio ('') escaparia da constraint como valor distinto
--   - numero_processo não tinha garantia de unicidade

-- 1. Impede source_id como string vazia (escaparia do UNIQUE como valor distinto)
ALTER TABLE public.licitacoes
  ADD CONSTRAINT licitacoes_source_id_not_empty
  CHECK (source_id IS NULL OR source_id <> '');

-- 2. Índice único parcial em numero_processo
--    Garante unicidade apenas para valores não-nulos,
--    protegendo contra duplicatas PNCP que chegam sem source_id mas com numero_processo
CREATE UNIQUE INDEX IF NOT EXISTS idx_licitacoes_numero_processo_unique
  ON public.licitacoes(numero_processo)
  WHERE numero_processo IS NOT NULL;

-- Rollback:
-- DROP INDEX IF EXISTS idx_licitacoes_numero_processo_unique;
-- ALTER TABLE public.licitacoes DROP CONSTRAINT IF EXISTS licitacoes_source_id_not_empty;
