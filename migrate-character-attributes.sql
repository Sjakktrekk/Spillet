-- Migrasjonsskript for å oppdatere eksisterende karakterers attributter
-- Kjør dette i Supabase SQL Editor

-- Start en transaksjon så vi kan rulle tilbake om noe går galt
BEGIN;

-- Først setter vi alle attributter til standardverdi 5
UPDATE characters
SET 
  strength = 5,
  knowledge = 5,
  agility = 5,
  magic = 5;

-- Deretter legger vi til klassespesifikke bonuser
-- Kriger (class_id = 2): +3 styrke, +2 smidighet
UPDATE characters
SET 
  strength = strength + 3,
  agility = agility + 2
WHERE class_id = 2;

-- Eventyrer (class_id = 1): +3 smidighet, +2 kunnskap
UPDATE characters
SET 
  agility = agility + 3,
  knowledge = knowledge + 2
WHERE class_id = 1;

-- Magiker (class_id = 3): +3 magi, +2 kunnskap
UPDATE characters
SET 
  magic = magic + 3,
  knowledge = knowledge + 2
WHERE class_id = 3;

-- Tyv (class_id = 4): +2 smidighet, +2 styrke, +1 kunnskap
UPDATE characters
SET 
  agility = agility + 2,
  strength = strength + 2,
  knowledge = knowledge + 1
WHERE class_id = 4;

-- Verifiser endringene (valgfritt, fjern kommentartegn for å kjøre)
-- SELECT id, name, class_id, strength, knowledge, agility, magic FROM characters;

-- Bekreft endringene
COMMIT;

-- Hvis noe går galt, kan du rulle tilbake endringene med:
-- ROLLBACK; 