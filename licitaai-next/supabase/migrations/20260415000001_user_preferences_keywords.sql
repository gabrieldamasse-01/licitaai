-- Adiciona coluna keywords na tabela user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;
