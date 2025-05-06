-- Migrasjonsskript for å støtte ferdighetssystemet i items-tabellen
-- Kjør dette i Supabase SQL Editor

-- Først sjekker vi om attributtes-kolonnen allerede eksisterer i items-tabellen
DO $$
BEGIN
  -- Sjekk om kolonnen eksisterer
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'attributes'
  ) THEN
    -- Legg til kolonnen hvis den ikke finnes
    EXECUTE 'ALTER TABLE public.items ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT ''{}''';
    
    -- Prøv å konvertere eksisterende attributter til JSON-format
    BEGIN
      -- Sjekk først om kolonnene finnes før vi prøver å konvertere
      IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'items' 
        AND column_name = 'vitality_bonus'
      ) THEN
        UPDATE public.items
        SET attributes = jsonb_build_object(
          'Utholdenhet', COALESCE(vitality_bonus, 0)
        );
        RAISE NOTICE 'Attributter konvertert til JSON-format';
      ELSE
        -- Initialiser tomme attributter hvis kolonnene ikke finnes
        RAISE NOTICE 'Attributt-kolonnene eksisterer ikke, oppretter tom JSON';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Kunne ikke konvertere attributter: %', SQLERRM;
    END;
    
    -- Informer om at migrasjonen er gjennomført
    RAISE NOTICE 'Attributes-kolonnen er lagt til';
  ELSE
    RAISE NOTICE 'Attributes-kolonnen finnes allerede i items-tabellen, ingen endringer utført';
  END IF;
END;
$$; 