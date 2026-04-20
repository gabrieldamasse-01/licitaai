-- Migration: Adicionar camada e cnaes_aplicaveis em document_types
-- Permite diferenciar documentos obrigatórios (camada='habilitacao') de
-- específicos por setor (camada='nicho') e filtrar por CNAE da empresa.

ALTER TABLE public.document_types
  ADD COLUMN IF NOT EXISTS camada TEXT NOT NULL DEFAULT 'habilitacao',
  ADD COLUMN IF NOT EXISTS cnaes_aplicaveis TEXT[] NOT NULL DEFAULT '{}';

-- Seed: tipos de nicho para construção civil (CNAEs 41, 42, 43)
INSERT INTO public.document_types (nome, categoria, camada, cnaes_aplicaveis, obrigatorio_padrao, validade_dias)
VALUES
  ('Registro CREA/CAU', 'Habilitação Técnica', 'nicho', ARRAY['41', '42', '43'], true, 365),
  ('Acervo Técnico (CAT)', 'Habilitação Técnica', 'nicho', ARRAY['41', '42', '43'], true, NULL),
  ('Atestado de Capacidade Técnica - Obras', 'Habilitação Técnica', 'nicho', ARRAY['41', '42', '43'], true, NULL)
ON CONFLICT DO NOTHING;

-- Seed: tipos de nicho para saúde (CNAEs 86, 87, 88)
INSERT INTO public.document_types (nome, categoria, camada, cnaes_aplicaveis, obrigatorio_padrao, validade_dias)
VALUES
  ('Alvará Sanitário', 'Licenças', 'nicho', ARRAY['86', '87', '88'], true, 365),
  ('CRM / CRF / CRO (Responsável Técnico)', 'Habilitação Técnica', 'nicho', ARRAY['86', '87', '88'], true, 365),
  ('Licença de Funcionamento ANVISA', 'Licenças', 'nicho', ARRAY['86', '87', '88'], false, 365)
ON CONFLICT DO NOTHING;

-- Seed: tipos de nicho para TI/Serviços (CNAEs 62, 63)
INSERT INTO public.document_types (nome, categoria, camada, cnaes_aplicaveis, obrigatorio_padrao, validade_dias)
VALUES
  ('Certidão de Regularidade - CREA/CFT (TI)', 'Habilitação Técnica', 'nicho', ARRAY['62', '63'], false, 365),
  ('Atestado de Capacidade Técnica - Software', 'Habilitação Técnica', 'nicho', ARRAY['62', '63'], true, NULL)
ON CONFLICT DO NOTHING;

-- Seed: tipos de nicho para transporte (CNAE 49)
INSERT INTO public.document_types (nome, categoria, camada, cnaes_aplicaveis, obrigatorio_padrao, validade_dias)
VALUES
  ('ANTT - Registro de Transportador', 'Licenças', 'nicho', ARRAY['49'], true, 365),
  ('Seguro de Responsabilidade Civil', 'Seguros', 'nicho', ARRAY['49'], true, 365)
ON CONFLICT DO NOTHING;
