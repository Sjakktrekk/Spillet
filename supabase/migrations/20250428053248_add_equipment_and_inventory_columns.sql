-- Legg til kolonner for equipment og inventory i characters-tabellen
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT NULL;

-- Kommentar: 
-- equipment vil inneholde utstyr som er i bruk, strukturert som et objekt med slots.
-- inventory vil inneholde alle gjenstander og ressurser spilleren eier.
-- Begge bruker JSONB-type som lar oss lagre komplekse strukturer.
