-- Adiciona company_id e relevancia_score à tabela matches
-- para suportar o fluxo de oportunidades via companies (não clientes)

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS company_id      uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS relevancia_score int;

-- Índice único para upsert por company_id + licitacao_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_company_licitacao
  ON public.matches(company_id, licitacao_id)
  WHERE company_id IS NOT NULL;

-- RLS: usuário vê matches das suas companies
CREATE POLICY IF NOT EXISTS "Users see own matches by company"
  ON public.matches FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );
