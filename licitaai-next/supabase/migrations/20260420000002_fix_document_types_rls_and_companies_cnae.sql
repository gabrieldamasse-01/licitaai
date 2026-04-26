-- Migration: Fix RLS em document_types + garantir companies.cnae
-- Problema 1: document_types sem policy de SELECT → select no cliente retorna vazio
-- Problema 2: companies.cnae pode não existir se o schema foi criado antes desta coluna

-- 1. Garantir que companies.cnae existe como TEXT[]
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cnae TEXT[] NOT NULL DEFAULT '{}';

-- 2. Garantir que document_types tem RLS habilitado
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- 3. Policy de leitura pública para usuários autenticados em document_types
--    (é uma tabela de referência — sem dados sensíveis de usuário)
DROP POLICY IF EXISTS "usuarios autenticados leem tipos de documento" ON public.document_types;
CREATE POLICY "usuarios autenticados leem tipos de documento"
  ON public.document_types
  FOR SELECT
  USING (auth.role() = 'authenticated');
