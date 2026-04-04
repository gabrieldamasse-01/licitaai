CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  cargo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  adicionado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_podem_ver" ON admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE ativo = true)
    OR auth.email() = 'gabriel.damasse@mgnext.com'
  );
