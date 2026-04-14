-- Migration: Tabela clientes
-- Cria a tabela de perfil estendido das empresas clientes com critérios de matching

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  cnaes TEXT[] DEFAULT '{}',
  criterios JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem seus clientes" ON clientes
  FOR ALL USING (user_id = auth.uid());
