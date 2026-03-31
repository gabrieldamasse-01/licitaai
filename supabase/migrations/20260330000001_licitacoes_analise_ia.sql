-- Campos de análise IA na tabela licitacoes
ALTER TABLE public.licitacoes
  ADD COLUMN IF NOT EXISTS analise_resumo            text,
  ADD COLUMN IF NOT EXISTS analise_requisitos        jsonb,
  ADD COLUMN IF NOT EXISTS analise_criterio          text,
  ADD COLUMN IF NOT EXISTS analise_prazo_entrega     text,
  ADD COLUMN IF NOT EXISTS analise_garantias         text,
  ADD COLUMN IF NOT EXISTS analise_pontos_atencao    jsonb,
  ADD COLUMN IF NOT EXISTS analise_score_complexidade int,
  ADD COLUMN IF NOT EXISTS analise_palavras_chave    jsonb,
  ADD COLUMN IF NOT EXISTS analisado_em              timestamptz,
  ADD COLUMN IF NOT EXISTS erro_analise              text;

CREATE INDEX IF NOT EXISTS idx_licitacoes_score
  ON public.licitacoes(analise_score_complexidade);

CREATE INDEX IF NOT EXISTS idx_licitacoes_palavras_chave
  ON public.licitacoes USING gin(analise_palavras_chave);
