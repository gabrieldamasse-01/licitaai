-- Garante que a tabela documentos tem as colunas necessárias
-- para o processamento automático de PDFs pela Edge Function

-- Cria a tabela se não existir
CREATE TABLE IF NOT EXISTS public.documentos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_arquivo text NOT NULL,
  url         text NOT NULL,
  -- Campos preenchidos pela Edge Function após análise da IA
  nome_documento  text,
  data_vencimento date,
  status          text CHECK (status IN ('pendente', 'valido', 'expirado')) DEFAULT 'pendente',
  processado_em   timestamptz
);

-- Adiciona colunas caso a tabela já exista (idempotente)
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS nome_documento  text,
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS status          text CHECK (status IN ('pendente', 'valido', 'expirado')) DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS processado_em   timestamptz;

-- Index para buscas por status (dashboard de documentos)
CREATE INDEX IF NOT EXISTS idx_documentos_status ON public.documentos(status);
CREATE INDEX IF NOT EXISTS idx_documentos_user_id ON public.documentos(user_id);

-- Row Level Security: cada usuário vê apenas seus documentos
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own documents"
  ON public.documentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own documents"
  ON public.documentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role (Edge Function) pode atualizar qualquer registro
CREATE POLICY IF NOT EXISTS "Service role can update documents"
  ON public.documentos FOR UPDATE
  USING (true)
  WITH CHECK (true);
