-- Migration: Segurança do bucket 'documentos' no Supabase Storage
-- Garante que somente o dono do arquivo pode fazer upload, leitura e exclusão.
-- O path dos arquivos segue a estrutura: {user_id}/{company_id}/{filename}

-- Torna o bucket privado (não-público)
UPDATE storage.buckets
SET public = false
WHERE id = 'documentos';

-- Remove policies antigas se existirem
DROP POLICY IF EXISTS "Usuários acessam seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários fazem upload de seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários deletam seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "documentos_select" ON storage.objects;
DROP POLICY IF EXISTS "documentos_insert" ON storage.objects;
DROP POLICY IF EXISTS "documentos_delete" ON storage.objects;

-- SELECT: só o dono pode ler (o primeiro segmento do path é o user_id)
CREATE POLICY "documentos_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT: só pode fazer upload na própria pasta
CREATE POLICY "documentos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: só pode atualizar arquivos próprios
CREATE POLICY "documentos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: só pode deletar arquivos próprios
CREATE POLICY "documentos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
