-- Migrasjonsskript for nytt ferdighetssystem
-- Kjør dette i Supabase SQL Editor

-- 1. Opprett ny tabell for player_skills
DROP TABLE IF EXISTS player_skills CASCADE;
CREATE TABLE player_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- Indeks for raskere oppslag
CREATE INDEX idx_player_skills_user_id ON player_skills(user_id);

-- Aktiver ROW LEVEL SECURITY
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;

-- Opprett policy for å lese ferdigheter
CREATE POLICY "Brukere kan se sine egne ferdigheter" ON player_skills
  FOR SELECT USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

-- Opprett policy for å administrere ferdigheter
CREATE POLICY "Brukere kan administrere sine egne ferdigheter" ON player_skills
  FOR ALL USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

-- 2. Migrasjonsskript for å konvertere attributter til ferdigheter
-- Dette vil kjøre for alle eksisterende brukere

-- Sjekk om attributes-kolonnen eksisterer i items-tabellen
DO $$
BEGIN
  -- Legg til attributes-kolonnen om den ikke finnes 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'attributes'
  ) THEN
    EXECUTE 'ALTER TABLE public.items ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT ''{}''';
    
    -- Prøv å konvertere attributter hvis kolonnene finnes
    BEGIN
      -- Sjekk først om kolonnene finnes før vi prøver å konvertere
      IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'items' 
        AND column_name = 'strength_bonus'
      ) THEN
        UPDATE public.items
        SET attributes = jsonb_build_object(
          'Nærkamp', COALESCE(strength_bonus, 0),
          'Skyteferdighet', COALESCE(dexterity_bonus, 0),
          'Kunnskap', COALESCE(intelligence_bonus, 0),
          'Magi', COALESCE(mana_bonus, 0),
          'Utholdenhet', COALESCE(health_bonus, 0)
        );
        RAISE NOTICE 'Attributter konvertert til JSON-format';
      ELSE
        RAISE NOTICE 'Attributt-kolonnene eksisterer ikke, oppretter tom JSON';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Kunne ikke konvertere attributter: %', SQLERRM;
    END;
  END IF;
END $$;

-- Funksjon for å migrere en brukers attributter til ferdigheter
CREATE OR REPLACE FUNCTION migrate_attributes_to_skills(p_user_id UUID) RETURNS void AS $$
DECLARE
  char_rec RECORD;
BEGIN
  -- Hent karakterinformasjon
  SELECT * INTO char_rec FROM characters WHERE user_id = p_user_id;
  
  IF FOUND THEN
    BEGIN
      -- Konverter styrke-attributt til Nærkamp-ferdighet (hvis kolonnen finnes)
      INSERT INTO player_skills (user_id, skill_name, level, progress)
      VALUES (p_user_id, 'Nærkamp', GREATEST(1, COALESCE(char_rec.strength, 0) / 5), (COALESCE(char_rec.strength, 0) % 5))
      ON CONFLICT (user_id, skill_name) DO NOTHING;
      
      -- Konverter smidighet-attributt til Skyteferdighet
      INSERT INTO player_skills (user_id, skill_name, level, progress)
      VALUES (p_user_id, 'Skyteferdighet', GREATEST(1, COALESCE(char_rec.agility, 0) / 5), (COALESCE(char_rec.agility, 0) % 5))
      ON CONFLICT (user_id, skill_name) DO NOTHING;
      
      -- Konverter fra kunnskap-attributt til Kunnskap-ferdighet
      INSERT INTO player_skills (user_id, skill_name, level, progress)
      VALUES (p_user_id, 'Kunnskap', GREATEST(1, COALESCE(char_rec.knowledge, 0) / 5), (COALESCE(char_rec.knowledge, 0) % 5))
      ON CONFLICT (user_id, skill_name) DO NOTHING;
      
      -- Konverter fra magi-attributt til Magi-ferdighet
      INSERT INTO player_skills (user_id, skill_name, level, progress)
      VALUES (p_user_id, 'Magi', GREATEST(1, COALESCE(char_rec.magic, 0) / 5), (COALESCE(char_rec.magic, 0) % 5))
      ON CONFLICT (user_id, skill_name) DO NOTHING;
      
      EXCEPTION WHEN undefined_column THEN
        -- Hvis attributt-kolonnene ikke finnes, opprett bare standardferdigheter
        RAISE NOTICE 'Attributt-kolonnene eksisterer ikke, oppretter standardferdigheter';
    END;
    
    -- Legg til nye ferdigheter som standard
    INSERT INTO player_skills (user_id, skill_name, level, progress)
    VALUES 
      (p_user_id, 'Nærkamp', 1, 0),
      (p_user_id, 'Skyteferdighet', 1, 0),
      (p_user_id, 'Kunnskap', 1, 0),
      (p_user_id, 'Magi', 1, 0),
      (p_user_id, 'Utholdenhet', 1, 0),
      (p_user_id, 'Utforskning', 1, 0),
      (p_user_id, 'Overtalelse', 1, 0),
      (p_user_id, 'Håndverk', 1, 0)
    ON CONFLICT (user_id, skill_name) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Kjør migrering for alle eksisterende brukere
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN SELECT DISTINCT user_id FROM characters LOOP
    PERFORM migrate_attributes_to_skills(user_rec.user_id);
  END LOOP;
END;
$$;

-- 3. Opprett standardferdigheter for nye karakterer
-- Dette blir håndtert i koden, men for å sikre databaser med API-kall:

-- Opprett eller erstatt funksjonen for initialisering av ferdigheter
CREATE OR REPLACE FUNCTION initialize_character_skills() RETURNS TRIGGER AS $$
BEGIN
  -- Opprett standardferdigheter for nye karakterer
  INSERT INTO player_skills (user_id, skill_name, level, progress)
  VALUES 
    (NEW.user_id, 'Nærkamp', 1, 0),
    (NEW.user_id, 'Skyteferdighet', 1, 0),
    (NEW.user_id, 'Kunnskap', 1, 0),
    (NEW.user_id, 'Magi', 1, 0),
    (NEW.user_id, 'Utholdenhet', 1, 0),
    (NEW.user_id, 'Utforskning', 1, 0),
    (NEW.user_id, 'Overtalelse', 1, 0),
    (NEW.user_id, 'Håndverk', 1, 0)
  ON CONFLICT (user_id, skill_name) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Opprett trigger bare hvis den ikke allerede eksisterer
DO $$
BEGIN
  -- Sjekk om triggeren allerede finnes
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'initialize_skills_for_new_character'
  ) THEN
    -- Opprett trigger hvis den ikke finnes
    EXECUTE 'CREATE TRIGGER initialize_skills_for_new_character
             AFTER INSERT ON characters
             FOR EACH ROW
             EXECUTE FUNCTION initialize_character_skills();';
    RAISE NOTICE 'Trigger for initialisering av ferdigheter opprettet';
  ELSE
    RAISE NOTICE 'Trigger for initialisering av ferdigheter eksisterer allerede';
  END IF;
END;
$$; 