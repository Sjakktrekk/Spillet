-- Legg til avatar_url-kolonne til characters-tabellen
-- Denne filen skal brukes hvis du ikke vil droppe og opprette tabellen på nytt

-- Sjekk om kolonnen eksisterer først for å unngå feil
DO $$
BEGIN
    -- Sjekk om kolonnen allerede eksisterer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' 
                   AND table_name='characters' 
                   AND column_name='avatar_url') THEN
        -- Legg til kolonnen hvis den ikke finnes
        ALTER TABLE public.characters ADD COLUMN avatar_url TEXT DEFAULT NULL;
        RAISE NOTICE 'Avatar-kolonne lagt til!';
    ELSE
        RAISE NOTICE 'Avatar-kolonne eksisterer allerede!';
    END IF;
END $$; 