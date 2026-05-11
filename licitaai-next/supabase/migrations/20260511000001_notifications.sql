-- Migration: tabela de notificações in-app
-- Criada em: 2026-05-11

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        text NOT NULL DEFAULT 'sistema',
  titulo      text NOT NULL,
  mensagem    text NOT NULL,
  lida        boolean NOT NULL DEFAULT false,
  link        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_lida_idx       ON public.notifications(user_id, lida) WHERE lida = false;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê próprias notificações" ON public.notifications;
CREATE POLICY "Usuário vê próprias notificações"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário atualiza próprias notificações" ON public.notifications;
CREATE POLICY "Usuário atualiza próprias notificações"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role pode inserir notificações para qualquer usuário (crons, agentes)
DROP POLICY IF EXISTS "Service role insere notificações" ON public.notifications;
CREATE POLICY "Service role insere notificações"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Realtime: habilitar publicação
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
