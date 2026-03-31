-- ============================================================
-- Tabela: clientes
-- Perfil de cada empresa usuária da plataforma
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Dados da empresa
  cnpj            text UNIQUE,
  razao_social    text NOT NULL,

  -- Critérios de matching
  palavras_chave  text[]  DEFAULT '{}',   -- ex: {"pavimentação","asfalto","obras viárias"}
  uf_interesse    text[]  DEFAULT '{}',   -- ex: {"SP","MG"} — vazio = nacional
  modalidades     int[]   DEFAULT '{}',   -- ex: {5,4} — vazio = todas
  valor_min       numeric(18,2),          -- null = sem limite inferior
  valor_max       numeric(18,2),          -- null = sem limite superior
  segmentos       text[]  DEFAULT '{}',   -- ex: {"engenharia civil","TI"}

  -- Configurações de notificação
  notificar_email boolean DEFAULT true,
  score_minimo    int     DEFAULT 60      -- só notifica acima desse score
);

CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage own client"
  ON public.clientes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role full access clientes"
  ON public.clientes FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================================
-- Tabela: matches
-- Resultado do matching entre licitação e cliente
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  licitacao_id    uuid REFERENCES public.licitacoes(id) ON DELETE CASCADE NOT NULL,
  cliente_id      uuid REFERENCES public.clientes(id)   ON DELETE CASCADE NOT NULL,

  -- Score e breakdown
  score           int  NOT NULL CHECK (score BETWEEN 0 AND 100),
  score_keywords  int  DEFAULT 0,  -- contribuição das palavras-chave (0-40)
  score_uf        int  DEFAULT 0,  -- contribuição da UF (0-20)
  score_valor     int  DEFAULT 0,  -- contribuição da faixa de valor (0-20)
  score_segmento  int  DEFAULT 0,  -- contribuição do segmento (0-20)

  keywords_matched  text[],        -- quais palavras bateram
  justificativa     text,          -- frase gerada pelo scoring

  -- Status de acompanhamento pelo cliente
  status          text CHECK (status IN ('novo','visualizado','interesse','descartado'))
                  DEFAULT 'novo',
  notificado_em   timestamptz,

  UNIQUE (licitacao_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_cliente_id   ON public.matches(cliente_id);
CREATE INDEX IF NOT EXISTS idx_matches_licitacao_id ON public.matches(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_matches_score        ON public.matches(score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status       ON public.matches(status);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users see own matches"
  ON public.matches FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users update own matches"
  ON public.matches FOR UPDATE
  USING (
    cliente_id IN (
      SELECT id FROM public.clientes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Service role full access matches"
  ON public.matches FOR ALL
  USING (true) WITH CHECK (true);
