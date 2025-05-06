-- SQL-skript for å legge til effect og effect_value kolonner til items-tabellen
-- Kjør denne SQL-koden i Supabase SQL Editor før du kjører insert_basic_items.sql

-- Legg til effect-kolonne
ALTER TABLE items ADD COLUMN IF NOT EXISTS effect TEXT;

-- Legg til effect_value-kolonne
ALTER TABLE items ADD COLUMN IF NOT EXISTS effect_value INTEGER DEFAULT 0; 