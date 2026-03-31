-- ============================================================
-- Tabela: licitacoes
-- Armazena licitações coletadas do PNCP + conteúdo raspado
-- ============================================================
CREATE TABLE IF NOT EXISTS public.licitacoes (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL,

  -- Identificação PNCP
  numero_compra         text NOT NULL,
  ano_compra            int  NOT NULL,
  sequencial_compra     int  NOT NULL,
  cnpj_orgao            text NOT NULL,

  -- Dados do órgão
  orgao_razao_social    text,
  uf_sigla              text,
  uf_nome               text,
  municipio_nome        text,

  -- Dados da licitação
  objeto                text,
  modalidade_id         int,
  modalidade_nome       text,
  situacao_id           int,
  situacao_nome         text,
  valor_estimado        numeric(18,2),
  data_publicacao_pncp  timestamptz,
  data_abertura         timestamptz,
  data_encerramento     timestamptz,
  link_sistema_origem   text,

  -- Conteúdo raspado via Firecrawl
  edital_markdown       text,
  edital_raspado_em     timestamptz,
  erro_scraping         text,

  UNIQUE (numero_compra, ano_compra, sequencial_compra, cnpj_orgao)
);

CREATE INDEX IF NOT EXISTS idx_licitacoes_uf         ON public.licitacoes(uf_sigla);
CREATE INDEX IF NOT EXISTS idx_licitacoes_modalidade  ON public.licitacoes(modalidade_id);
CREATE INDEX IF NOT EXISTS idx_licitacoes_situacao    ON public.licitacoes(situacao_id);
CREATE INDEX IF NOT EXISTS idx_licitacoes_publicacao  ON public.licitacoes(data_publicacao_pncp DESC);

ALTER TABLE public.licitacoes ENABLE ROW LEVEL SECURITY;

-- Licitações são dados públicos — qualquer autenticado pode ler
CREATE POLICY IF NOT EXISTS "Authenticated users can read licitacoes"
  ON public.licitacoes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas service role pode inserir/atualizar (cron jobs)
CREATE POLICY IF NOT EXISTS "Service role can write licitacoes"
  ON public.licitacoes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Tabela: agent_logs
-- Registra execuções dos cron jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  agent       text NOT NULL,
  status      text CHECK (status IN ('success', 'error')) NOT NULL,
  mensagem    text,
  detalhes    jsonb,
  duracao_ms  int
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent     ON public.agent_logs(agent);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created   ON public.agent_logs(created_at DESC);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role can write agent_logs"
  ON public.agent_logs FOR ALL
  USING (true)
  WITH CHECK (true);
