-- Legg til slot-kolonne i character_items-tabellen
ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS slot TEXT;

-- Oppdater skjema-cache for tabellen
COMMENT ON TABLE character_items IS 'Kobling mellom karakterer og gjenstander med slot-informasjon';
COMMENT ON COLUMN character_items.slot IS 'Utstyrsplass for gjenstanden (hode, kropp, våpen, etc.)';

-- Sett standard slot-verdi for eksisterende oppføringer
UPDATE character_items
SET slot = 'inventory'
WHERE slot IS NULL; 