-- ============================================================
-- LicitaAI — Schema Completo
-- Versão: 1.0.0
-- Data: 2026-03-31
-- ============================================================
-- Execute este arquivo no SQL Editor do Supabase para criar
-- toda a estrutura do banco de dados do LicitaAI.
-- ============================================================

-- ============================================================
-- EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE porte_empresa AS ENUM ('MEI', 'ME', 'EPP', 'MEDIO', 'GRANDE');

CREATE TYPE status_documento AS ENUM ('ativo', 'vencido', 'pendente', 'rejeitado', 'processando');

CREATE TYPE categoria_documento AS ENUM (
  'fiscal_federal',
  'fiscal_estadual',
  'fiscal_municipal',
  'trabalhista',
  'contabil',
  'juridico',
  'tecnico',
  'outro'
);

CREATE TYPE status_licitacao AS ENUM ('ativa', 'encerrada', 'suspensa', 'cancelada', 'homologada');

CREATE TYPE status_match AS ENUM ('pendente', 'analisando', 'aprovado', 'descartado', 'participando');

CREATE TYPE classificacao_analise AS ENUM ('ALTA', 'MEDIA', 'BAIXA', 'INVIAVEL');

CREATE TYPE status_agent AS ENUM ('running', 'success', 'error', 'timeout');

-- ============================================================
-- TABELA: companies
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razao_social      TEXT          NOT NULL,
  cnpj              TEXT          NOT NULL UNIQUE,
  cnae              TEXT[]        DEFAULT '{}',
  porte             porte_empresa NOT NULL DEFAULT 'ME',
  endereco          JSONB,        -- { logradouro, numero, bairro, cidade, uf, cep }
  contato           TEXT,
  email_contato     TEXT,
  keywords          TEXT[]        DEFAULT '{}',
  ufs_interesse     TEXT[]        DEFAULT '{}',
  valor_min         NUMERIC(15,2),
  valor_max         NUMERIC(15,2),
  ativo             BOOLEAN       NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_ativo ON companies(ativo);

-- ============================================================
-- TABELA: document_types
-- ============================================================
CREATE TABLE IF NOT EXISTS document_types (
  id                UUID              DEFAULT gen_random_uuid() PRIMARY KEY,
  nome              TEXT              NOT NULL UNIQUE,
  categoria         categoria_documento NOT NULL DEFAULT 'outro',
  validade_dias     INTEGER,          -- NULL = sem validade definida
  obrigatorio_padrao BOOLEAN          NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: documents
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id                UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id        UUID            NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type_id  UUID            REFERENCES document_types(id) ON DELETE SET NULL,
  tipo              TEXT            NOT NULL, -- espelho de document_types.nome para histórico
  nome_arquivo      TEXT            NOT NULL,
  file_url          TEXT,
  data_emissao      DATE,
  data_validade     DATE,
  status            status_documento NOT NULL DEFAULT 'pendente',
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_data_validade ON documents(data_validade);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- ============================================================
-- TABELA: licitacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS licitacoes (
  id                UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id         TEXT            NOT NULL UNIQUE,  -- numeroControlePNCP
  orgao             TEXT            NOT NULL,
  objeto            TEXT            NOT NULL,
  valor_estimado    NUMERIC(15,2),
  modalidade        TEXT            NOT NULL,
  uf                CHAR(2),
  municipio         TEXT,
  data_abertura     TIMESTAMPTZ,
  data_encerramento TIMESTAMPTZ,
  source_url        TEXT,
  status            status_licitacao NOT NULL DEFAULT 'ativa',
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licitacoes_source_id ON licitacoes(source_id);
CREATE INDEX IF NOT EXISTS idx_licitacoes_uf ON licitacoes(uf);
CREATE INDEX IF NOT EXISTS idx_licitacoes_status ON licitacoes(status);
CREATE INDEX IF NOT EXISTS idx_licitacoes_data_abertura ON licitacoes(data_abertura);
CREATE INDEX IF NOT EXISTS idx_licitacoes_created_at ON licitacoes(created_at DESC);

-- Índice full-text para busca no objeto
CREATE INDEX IF NOT EXISTS idx_licitacoes_objeto_fts
  ON licitacoes USING gin(to_tsvector('portuguese', objeto));

-- ============================================================
-- TABELA: matches
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id        UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  licitacao_id      UUID          NOT NULL REFERENCES licitacoes(id) ON DELETE CASCADE,
  relevancia_score  SMALLINT      NOT NULL DEFAULT 0 CHECK (relevancia_score BETWEEN 0 AND 100),
  status            status_match  NOT NULL DEFAULT 'pendente',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_match_company_licitacao UNIQUE (company_id, licitacao_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_company_id ON matches(company_id);
CREATE INDEX IF NOT EXISTS idx_matches_licitacao_id ON matches(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_relevancia ON matches(relevancia_score DESC);

-- ============================================================
-- TABELA: edital_analyses
-- ============================================================
CREATE TABLE IF NOT EXISTS edital_analyses (
  id                UUID                  DEFAULT gen_random_uuid() PRIMARY KEY,
  licitacao_id      UUID                  NOT NULL UNIQUE REFERENCES licitacoes(id) ON DELETE CASCADE,
  analysis          JSONB                 NOT NULL, -- EditalAnalysis completa
  score_total       SMALLINT              NOT NULL CHECK (score_total BETWEEN 0 AND 100),
  classificacao     classificacao_analise NOT NULL,
  score_breakdown   JSONB                 NOT NULL, -- { documentacao, capacidade_tecnica, valor, prazo }
  cost_usd          NUMERIC(10,6),
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edital_analyses_licitacao_id ON edital_analyses(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_edital_analyses_classificacao ON edital_analyses(classificacao);

-- ============================================================
-- TABELA: agent_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  agent             TEXT          NOT NULL,
  status            status_agent  NOT NULL DEFAULT 'success',
  duration_ms       INTEGER,
  metadata          JSONB         DEFAULT '{}',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);

-- ============================================================
-- TABELA: api_usage
-- ============================================================
CREATE TABLE IF NOT EXISTS api_usage (
  date              DATE          PRIMARY KEY,
  cost_usd          NUMERIC(10,6) NOT NULL DEFAULT 0,
  input_tokens      INTEGER       NOT NULL DEFAULT 0,
  output_tokens     INTEGER       NOT NULL DEFAULT 0
);

-- ============================================================
-- FUNÇÃO: increment_api_usage
-- ============================================================
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_date          DATE,
  p_cost_usd      NUMERIC,
  p_input_tokens  INTEGER,
  p_output_tokens INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO api_usage (date, cost_usd, input_tokens, output_tokens)
  VALUES (p_date, p_cost_usd, p_input_tokens, p_output_tokens)
  ON CONFLICT (date) DO UPDATE SET
    cost_usd      = api_usage.cost_usd + p_cost_usd,
    input_tokens  = api_usage.input_tokens + p_input_tokens,
    output_tokens = api_usage.output_tokens + p_output_tokens;
END;
$$;

-- ============================================================
-- FUNÇÃO: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_own" ON companies
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "companies_insert_own" ON companies
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "companies_delete_own" ON companies
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "companies_service_role" ON companies
  FOR ALL USING (auth.role() = 'service_role');

-- documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own" ON documents
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_delete_own" ON documents
  FOR DELETE USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_service_role" ON documents
  FOR ALL USING (auth.role() = 'service_role');

-- document_types (leitura pública, escrita apenas service_role)
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_types_select_all" ON document_types
  FOR SELECT USING (true);

CREATE POLICY "document_types_service_role" ON document_types
  FOR ALL USING (auth.role() = 'service_role');

-- licitacoes (leitura pública, escrita apenas service_role)
ALTER TABLE licitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "licitacoes_select_all" ON licitacoes
  FOR SELECT USING (true);

CREATE POLICY "licitacoes_service_role" ON licitacoes
  FOR ALL USING (auth.role() = 'service_role');

-- matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_own" ON matches
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "matches_update_own" ON matches
  FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "matches_service_role" ON matches
  FOR ALL USING (auth.role() = 'service_role');

-- edital_analyses (leitura para donos do match, escrita service_role)
ALTER TABLE edital_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edital_analyses_select_own" ON edital_analyses
  FOR SELECT USING (
    licitacao_id IN (
      SELECT licitacao_id FROM matches
      WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "edital_analyses_service_role" ON edital_analyses
  FOR ALL USING (auth.role() = 'service_role');

-- agent_logs (apenas service_role)
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_logs_service_role" ON agent_logs
  FOR ALL USING (auth.role() = 'service_role');

-- api_usage (apenas service_role)
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_service_role" ON api_usage
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- SEED: document_types
-- ============================================================
INSERT INTO document_types (nome, categoria, validade_dias, obrigatorio_padrao) VALUES
  ('CND Federal',                   'fiscal_federal',   180,  true),
  ('CND Estadual',                  'fiscal_estadual',  180,  true),
  ('CND Municipal',                 'fiscal_municipal', 180,  true),
  ('Certificado FGTS (CRF)',        'trabalhista',      30,   true),
  ('CNDT — Certidão Negativa de Débitos Trabalhistas', 'trabalhista', 180, true),
  ('Balanço Patrimonial',           'contabil',         365,  true),
  ('Contrato Social',               'juridico',         NULL, true),
  ('Procuração',                    'juridico',         365,  false),
  ('Atestado Técnico de Capacidade', 'tecnico',         NULL, false),
  ('CRC — Registro Contábil',       'contabil',         365,  false),
  ('Alvará de Funcionamento',       'juridico',         365,  false),
  ('Certidão Negativa de Falência', 'juridico',         60,   true)
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
