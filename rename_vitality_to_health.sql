-- Endre kolonne-navn fra vitality_bonus til health i Supabase ved behov
-- Dette er valgfritt og kan utføres senere om ønskelig
ALTER TABLE items RENAME COLUMN vitality_bonus TO health;
