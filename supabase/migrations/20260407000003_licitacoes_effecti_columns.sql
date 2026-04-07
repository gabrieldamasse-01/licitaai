-- Garante que a tabela licitacoes tem todas as colunas necessárias
-- para armazenar dados da API Effecti (além das colunas PNCP originais)

-- Chave única da Effecti (process number ou idLicitacao)
ALTER TABLE public.licitacoes
  ADD COLUMN IF NOT EXISTS source_id        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS portal           TEXT,
  ADD COLUMN IF NOT EXISTS orgao            TEXT,
  ADD COLUMN IF NOT EXISTS uf               TEXT,
  ADD COLUMN IF NOT EXISTS municipio        TEXT,
  ADD COLUMN IF NOT EXISTS modalidade       TEXT,
  ADD COLUMN IF NOT EXISTS source_url       TEXT,
  ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'ativa',
  ADD COLUMN IF NOT EXISTS data_publicacao  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS numero_processo  TEXT,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now();

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_licitacoes_source_id     ON public.licitacoes(source_id);
CREATE INDEX IF NOT EXISTS idx_licitacoes_status        ON public.licitacoes(status);
CREATE INDEX IF NOT EXISTS idx_licitacoes_uf            ON public.licitacoes(uf);
CREATE INDEX IF NOT EXISTS idx_licitacoes_updated_at    ON public.licitacoes(updated_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS licitacoes_set_updated_at ON public.licitacoes;
CREATE TRIGGER licitacoes_set_updated_at
  BEFORE UPDATE ON public.licitacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
