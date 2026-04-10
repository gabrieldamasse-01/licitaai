-- Tabela para armazenar códigos OTP de autenticação de dois fatores
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash     text NOT NULL,          -- SHA-256 do código de 6 dígitos
  expires_at    timestamptz NOT NULL,   -- 10 minutos de validade
  used          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS otp_codes_user_id_idx ON public.otp_codes(user_id);

-- RLS: somente service role acessa (não expor ao cliente)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy pública — acesso somente via service role key
-- (as rotas de API usam createServiceClient)

-- Coluna two_factor_enabled na tabela user_preferences (se não existir)
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

-- Limpeza automática de OTPs expirados via função
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.otp_codes
  WHERE expires_at < now() OR used = true;
$$;
