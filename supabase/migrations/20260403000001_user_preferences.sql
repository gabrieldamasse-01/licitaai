-- ============================================================
-- TABELA: user_preferences
-- Armazena preferências de alerta por usuário
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  alertas_email BOOLEAN     NOT NULL DEFAULT true,
  alert_days    INTEGER     NOT NULL DEFAULT 30 CHECK (alert_days IN (7, 15, 30)),
  alert_email   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_gerencia_proprias_preferencias"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
