CREATE TABLE IF NOT EXISTS licitacoes_analise_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licitacao_id UUID REFERENCES licitacoes(id) ON DELETE CASCADE,
  analise TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(licitacao_id)
);

ALTER TABLE licitacoes_analise_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios autenticados leem" ON licitacoes_analise_ia
  FOR SELECT TO authenticated USING (true);
