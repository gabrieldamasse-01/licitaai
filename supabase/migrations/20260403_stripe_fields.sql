-- Adiciona campos de plano/Stripe em user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS plano TEXT NOT NULL DEFAULT 'gratuito',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMPTZ;
