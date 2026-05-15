-- CRM: tabela de leads e histórico de conversas com a Vendedora IA Ana

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  empresa TEXT,
  cnpj TEXT,
  origem TEXT DEFAULT 'landing_page',
  status TEXT DEFAULT 'novo',
  notas TEXT,
  ultima_interacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversas ENABLE ROW LEVEL SECURITY;

-- Admin tem acesso total
CREATE POLICY "admin_leads" ON leads FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND ativo = true));

CREATE POLICY "admin_conversas" ON lead_conversas FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND ativo = true));

-- Anônimos podem inserir leads (widget da landing page)
CREATE POLICY "public_insert_leads" ON leads FOR INSERT TO anon
WITH CHECK (true);

-- Índices
CREATE INDEX leads_email_idx ON leads (email);
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX lead_conversas_lead_id_idx ON lead_conversas (lead_id);
