-- Kjør denne SQL-koden i Supabase SQL Editor for å oppdatere databaseskjemaet
-- For å gjøre dette:
-- 1. Logg inn på https://supabase.com/dashboard
-- 2. Velg prosjektet ditt
-- 3. Gå til "SQL Editor" i venstre meny
-- 4. Opprett ny spørring, lim inn koden under, og kjør

-- Legg til kolonner for equipment og inventory i characters-tabellen
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT NULL;

-- Verifiser at kolonnene er lagt til
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'characters' 
  AND column_name IN ('equipment', 'inventory'); 