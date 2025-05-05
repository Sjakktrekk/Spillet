-- Migrasjonsskript for å slå sammen Nærkamp og Skyteferdighet til Kamp
-- Kjør dette i Supabase SQL Editor

-- 1. Sammenslå ferdighetene Nærkamp og Skyteferdighet til Kamp
DO $$
DECLARE
  v_user_record RECORD;
  v_melee_record RECORD;
  v_ranged_record RECORD;
  v_max_level INTEGER;
  v_max_progress INTEGER;
BEGIN
  -- Gå gjennom alle brukere
  FOR v_user_record IN SELECT DISTINCT user_id FROM player_skills LOOP
    -- Sjekk om brukeren har Nærkamp-ferdighet
    SELECT * INTO v_melee_record 
    FROM player_skills 
    WHERE user_id = v_user_record.user_id AND skill_name = 'Nærkamp';
    
    -- Sjekk om brukeren har Skyteferdighet-ferdighet
    SELECT * INTO v_ranged_record 
    FROM player_skills 
    WHERE user_id = v_user_record.user_id AND skill_name = 'Skyteferdighet';
    
    -- Bestem høyeste nivå og fremgang
    v_max_level := 1;
    v_max_progress := 0;
    
    IF v_melee_record IS NOT NULL AND v_ranged_record IS NOT NULL THEN
      -- Brukeren har begge ferdigheter, velg den høyeste
      IF v_melee_record.level > v_ranged_record.level THEN
        v_max_level := v_melee_record.level;
        v_max_progress := v_melee_record.progress;
      ELSIF v_melee_record.level < v_ranged_record.level THEN
        v_max_level := v_ranged_record.level;
        v_max_progress := v_ranged_record.progress;
      ELSE
        -- Samme nivå, bruk høyeste fremgang
        v_max_level := v_melee_record.level;
        v_max_progress := GREATEST(v_melee_record.progress, v_ranged_record.progress);
      END IF;
      
      -- Slett de gamle ferdighetene
      DELETE FROM player_skills 
      WHERE user_id = v_user_record.user_id 
      AND skill_name IN ('Nærkamp', 'Skyteferdighet');
      
      -- Opprett den nye Kamp-ferdigheten
      INSERT INTO player_skills (user_id, skill_name, level, progress) 
      VALUES (v_user_record.user_id, 'Kamp', v_max_level, v_max_progress);
      
    ELSIF v_melee_record IS NOT NULL THEN
      -- Brukeren har bare Nærkamp
      UPDATE player_skills 
      SET skill_name = 'Kamp' 
      WHERE id = v_melee_record.id;
      
    ELSIF v_ranged_record IS NOT NULL THEN
      -- Brukeren har bare Skyteferdighet
      UPDATE player_skills 
      SET skill_name = 'Kamp' 
      WHERE id = v_ranged_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Ferdighetene Nærkamp og Skyteferdighet er slått sammen til Kamp';
END;
$$;

-- 2. Oppdater attributter i items-tabellen
UPDATE items i
SET attributes = jsonb_set(
  COALESCE(i.attributes, '{}'::jsonb),
  '{Kamp}',
  COALESCE(
    GREATEST(
      (i.attributes->>'Nærkamp')::numeric,
      (i.attributes->>'Skyteferdighet')::numeric
    ),
    0
  )::text::jsonb
)
WHERE i.attributes ? 'Nærkamp' OR i.attributes ? 'Skyteferdighet';

-- 3. Fjern gamle attributt-referanser
UPDATE items
SET attributes = attributes - 'Nærkamp' - 'Skyteferdighet'
WHERE attributes IS NOT NULL; 