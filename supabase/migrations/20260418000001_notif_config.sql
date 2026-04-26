ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS notif_config JSONB DEFAULT '{
    "email_diario": true,
    "email_urgente": true,
    "in_app": true,
    "horario": "08:00",
    "score_minimo": 70
  }'::jsonb;
