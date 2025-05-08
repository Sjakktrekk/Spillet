-- Migrasjonsskript for å oppdatere rase-attributter til det nye ferdighetssystemet
-- Kjør dette i Supabase SQL Editor

-- Start en transaksjon
BEGIN;

-- Oppdater races-tabellen med nye kolonner
ALTER TABLE races
ADD COLUMN IF NOT EXISTS combat_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS endurance_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exploration_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS magic_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS persuasion_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS crafting_bonus INTEGER DEFAULT 0;

-- Oppdater eksisterende raser med nye ferdighetsbonuser
-- Menneske: Balansert fordeling
UPDATE races
SET 
  combat_bonus = 1,
  endurance_bonus = 1,
  exploration_bonus = 1,
  knowledge_bonus = 1,
  magic_bonus = 1,
  persuasion_bonus = 1,
  crafting_bonus = 1
WHERE name = 'Menneske';

-- Alv: Magi og Kunnskap
UPDATE races
SET 
  combat_bonus = 0,
  endurance_bonus = 0,
  exploration_bonus = 1,
  knowledge_bonus = 2,
  magic_bonus = 2,
  persuasion_bonus = 1,
  crafting_bonus = 0
WHERE name = 'Alv';

-- Dverg: Håndverk og Utholdenhet
UPDATE races
SET 
  combat_bonus = 1,
  endurance_bonus = 2,
  exploration_bonus = 0,
  knowledge_bonus = 1,
  magic_bonus = 0,
  persuasion_bonus = 0,
  crafting_bonus = 2
WHERE name = 'Dverg';

-- Ork: Kamp og Utholdenhet
UPDATE races
SET 
  combat_bonus = 3,
  endurance_bonus = 3,
  exploration_bonus = 1,
  knowledge_bonus = 0,
  magic_bonus = 0,
  persuasion_bonus = 0,
  crafting_bonus = 0
WHERE name = 'Ork';

-- Fjern bare de gamle attributt-kolonnene som ikke lenger brukes
ALTER TABLE races
DROP COLUMN IF EXISTS strength_bonus,
DROP COLUMN IF EXISTS agility_bonus;

-- Bekreft endringene
COMMIT; 