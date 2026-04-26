-- Migration: Garantir RLS correto na tabela companies
-- Problema: policies podem estar ausentes se o schema inicial não foi aplicado corretamente

-- 1. Garantir RLS habilitado
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Recriar policies com IF NOT EXISTS pattern (DROP + CREATE)
DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_insert_own" ON public.companies;
CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_delete_own" ON public.companies;
CREATE POLICY "companies_delete_own" ON public.companies
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "companies_service_role" ON public.companies;
CREATE POLICY "companies_service_role" ON public.companies
  FOR ALL USING (auth.role() = 'service_role');
