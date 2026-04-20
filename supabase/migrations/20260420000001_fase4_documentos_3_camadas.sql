-- Fase 4 POP — Documentos em 3 camadas

-- Camada 2: adicionar campo de nicho em document_types
ALTER TABLE document_types
  ADD COLUMN IF NOT EXISTS camada TEXT DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS cnaes_aplicaveis TEXT[] DEFAULT '{}';

-- Marcar todos os tipos existentes como 'geral'
UPDATE document_types SET camada = 'geral' WHERE camada IS NULL OR camada = '';

-- Inserir tipos de nicho
INSERT INTO document_types (nome, camada, cnaes_aplicaveis) VALUES
  ('Registro CREA/CAU', 'nicho', ARRAY['41', '42', '43', '71']),
  ('ART/RRT do Responsável Técnico', 'nicho', ARRAY['41', '42', '43', '71']),
  ('Alvará Sanitário', 'nicho', ARRAY['86', '87', '88', '56']),
  ('Registro ANVISA', 'nicho', ARRAY['21', '47', '86']),
  ('Certificado ISO 9001', 'nicho', ARRAY['26', '62', '63', '71']),
  ('Registro no Conselho de TI', 'nicho', ARRAY['62', '63']),
  ('Licença Ambiental', 'nicho', ARRAY['38', '39', '41', '42'])
ON CONFLICT (nome) DO UPDATE SET
  camada = EXCLUDED.camada,
  cnaes_aplicaveis = EXCLUDED.cnaes_aplicaveis;

-- Camada 3: documentos específicos do edital
CREATE TABLE IF NOT EXISTS edital_documentos_exigidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licitacao_id UUID REFERENCES licitacoes(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id),
  nome_exigido TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  extraido_por_ia BOOLEAN DEFAULT false,
  trecho_edital TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(licitacao_id, nome_exigido)
);

ALTER TABLE edital_documentos_exigidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "autenticados leem edital_docs"
  ON edital_documentos_exigidos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "service role full access edital_docs"
  ON edital_documentos_exigidos
  FOR ALL USING (true) WITH CHECK (true);

-- Index para lookup rápido por licitação
CREATE INDEX IF NOT EXISTS idx_edital_docs_licitacao_id
  ON edital_documentos_exigidos(licitacao_id);
