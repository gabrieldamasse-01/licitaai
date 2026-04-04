CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('documento_vencendo', 'documento_expirado', 'oportunidade_salva', 'boas_vindas')),
  titulo      TEXT NOT NULL,
  mensagem    TEXT NOT NULL,
  lida        BOOLEAN NOT NULL DEFAULT false,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprias_notificacoes"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- Índice para queries por user_id + lida
CREATE INDEX IF NOT EXISTS notifications_user_lida_idx
  ON notifications (user_id, lida, created_at DESC);

-- Habilita Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
