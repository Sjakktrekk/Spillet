-- Oppdater items-tabellen for å støtte det nye ferdighetssystemet
-- Kjør dette i Supabase SQL Editor

-- Start en transaksjon
BEGIN;

-- 1. Legg til nye kolonner for ferdighetsbonuser
ALTER TABLE items
ADD COLUMN IF NOT EXISTS naerkamp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skyteferdighet INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kunnskap INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS magi INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS utholdenhet INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS utforskning INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtalelse INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS haandverk INTEGER DEFAULT 0;

-- 2. Oppdater attributes-JSON-feltet til å inkludere de nye ferdighetsbonusene
-- Dette krever at gjenstander bruker JSON-feltet for bonuser
UPDATE items
SET attributes = attributes || jsonb_build_object(
  'naerkamp', naerkamp,
  'skyteferdighet', skyteferdighet,
  'kunnskap', kunnskap,
  'magi', magi,
  'utholdenhet', utholdenhet,
  'overtalelse', overtalelse,
  'utforskning', utforskning,
  'haandverk', haandverk
)
WHERE naerkamp > 0 OR skyteferdighet > 0 OR kunnskap > 0 OR magi > 0 OR 
      utholdenhet > 0 OR overtalelse > 0 OR utforskning > 0 OR haandverk > 0;

-- Bekreft endringene
COMMIT; 