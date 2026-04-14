-- Fix: RLS recursivo em admin_users
-- Remove a policy recursiva e cria função SECURITY DEFINER para evitar infinite recursion

DROP POLICY IF EXISTS "admins_podem_ver" ON admin_users;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.email() AND ativo = true
  );
$$;

CREATE POLICY "admins_podem_ver" ON admin_users
  FOR SELECT USING (is_admin_user());
