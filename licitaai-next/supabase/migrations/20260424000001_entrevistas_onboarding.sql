CREATE TABLE IF NOT EXISTS entrevistas_onboarding (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES auth.users(id),
  respostas     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  perfil_gerado JSONB,
  status        TEXT        NOT NULL DEFAULT 'em_andamento',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluida_em  TIMESTAMPTZ
);

ALTER TABLE entrevistas_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem suas entrevistas"
  ON entrevistas_onboarding
  FOR ALL
  USING (user_id = auth.uid());
