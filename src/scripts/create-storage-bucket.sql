-- Først, fjern eksisterende policies hvis de finnes
DROP POLICY IF EXISTS "Alle kan se bilder" ON storage.objects;
DROP POLICY IF EXISTS "Bare admin kan laste opp bilder" ON storage.objects;
DROP POLICY IF EXISTS "Bare admin kan slette bilder" ON storage.objects;

-- Opprett bucket hvis den ikke finnes
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'game-assets',
  'game-assets',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for å lese bilder (alle kan lese)
CREATE POLICY "Alle kan se bilder"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-assets');

-- Policy for å laste opp bilder (alle autentiserte brukere kan laste opp)
CREATE POLICY "Autentiserte brukere kan laste opp bilder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy for å oppdatere bilder
CREATE POLICY "Autentiserte brukere kan oppdatere egne bilder"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-assets'
  AND auth.role() = 'authenticated'
  AND owner = auth.uid()
);

-- Policy for å slette bilder
CREATE POLICY "Autentiserte brukere kan slette egne bilder"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-assets'
  AND auth.role() = 'authenticated'
  AND owner = auth.uid()
); 