-- Tabela de feedbacks dos usuários beta
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('bug', 'sugestao', 'elogio')),
  titulo      TEXT NOT NULL,
  descricao   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Usuário pode inserir seus próprios feedbacks
CREATE POLICY "feedback_insert_own"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode ler seus próprios feedbacks
CREATE POLICY "feedback_select_own"
  ON feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
