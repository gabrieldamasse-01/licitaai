-- ============================================================
-- Migration: criar tabela alert_logs
-- Data: 2026-04-02
-- Responsável: comms-agent / Comms Agent
-- ============================================================
-- Registra cada alerta de documento enviado por e-mail,
-- permitindo auditoria e controle de re-envio.
-- ============================================================

CREATE TABLE IF NOT EXISTS alert_logs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id   UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tipo          TEXT        NOT NULL CHECK (tipo IN ('vencendo', 'expirado')),
  enviado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  destinatario  TEXT        NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_logs_document_id ON alert_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_enviado_em  ON alert_logs(enviado_em DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode ler e inserir
CREATE POLICY "alert_logs_service_role_select" ON alert_logs
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "alert_logs_service_role_insert" ON alert_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
