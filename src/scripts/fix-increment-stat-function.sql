-- SQL-skript for å opprette eller oppdatere increment_user_stat funksjonen i Supabase
-- Kjør denne SQL-koden i Supabase SQL Editor

-- Fjern eventuelt gamle funksjoner først
DROP FUNCTION IF EXISTS increment_stat(TEXT, INTEGER);
DROP FUNCTION IF EXISTS increment_user_stat(UUID, TEXT, INTEGER);

-- Opprett funksjonen med riktige parametere
CREATE OR REPLACE FUNCTION increment_user_stat(
  user_id_param UUID,
  stat_key TEXT,
  increment_amount INT DEFAULT 1
) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  current_value INT;
BEGIN
  -- Sjekk om brukeren har en statistikkrad i user_stats
  SELECT INTO current_value
    CASE 
      WHEN stat_key = 'login_count' THEN login_count
      WHEN stat_key = 'quests_completed' THEN quests_completed
      WHEN stat_key = 'messages_count' THEN messages_count
      WHEN stat_key = 'items_collected' THEN items_collected
      WHEN stat_key = 'monsters_killed' THEN monsters_killed
      WHEN stat_key = 'gold_earned' THEN gold_earned
    END
  FROM public.user_stats 
  WHERE user_id = user_id_param;
  
  -- Hvis brukeren ikke har statistikk ennå
  IF current_value IS NULL THEN
    -- Opprett en ny rad med initialverdier
    INSERT INTO public.user_stats (
      user_id, 
      login_count, 
      quests_completed, 
      messages_count, 
      items_collected, 
      monsters_killed, 
      gold_earned,
      cities_visited,
      last_updated
    ) VALUES (
      user_id_param,
      CASE WHEN stat_key = 'login_count' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'quests_completed' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'messages_count' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'items_collected' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'monsters_killed' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'gold_earned' THEN increment_amount ELSE 0 END,
      '[]'::jsonb,
      NOW()
    )
    RETURNING jsonb_build_object(
      'user_id', user_id,
      'stat_key', stat_key,
      'new_value', 
      CASE 
        WHEN stat_key = 'login_count' THEN login_count
        WHEN stat_key = 'quests_completed' THEN quests_completed
        WHEN stat_key = 'messages_count' THEN messages_count
        WHEN stat_key = 'items_collected' THEN items_collected
        WHEN stat_key = 'monsters_killed' THEN monsters_killed
        WHEN stat_key = 'gold_earned' THEN gold_earned
      END
    ) INTO result;
  ELSE
    -- Oppdater eksisterende statistikk
    UPDATE public.user_stats
    SET 
      login_count = CASE WHEN stat_key = 'login_count' THEN login_count + increment_amount ELSE login_count END,
      quests_completed = CASE WHEN stat_key = 'quests_completed' THEN quests_completed + increment_amount ELSE quests_completed END,
      messages_count = CASE WHEN stat_key = 'messages_count' THEN messages_count + increment_amount ELSE messages_count END,
      items_collected = CASE WHEN stat_key = 'items_collected' THEN items_collected + increment_amount ELSE items_collected END,
      monsters_killed = CASE WHEN stat_key = 'monsters_killed' THEN monsters_killed + increment_amount ELSE monsters_killed END,
      gold_earned = CASE WHEN stat_key = 'gold_earned' THEN gold_earned + increment_amount ELSE gold_earned END,
      last_updated = NOW()
    WHERE user_id = user_id_param
    RETURNING jsonb_build_object(
      'user_id', user_id,
      'stat_key', stat_key,
      'new_value', 
      CASE 
        WHEN stat_key = 'login_count' THEN login_count
        WHEN stat_key = 'quests_completed' THEN quests_completed
        WHEN stat_key = 'messages_count' THEN messages_count
        WHEN stat_key = 'items_collected' THEN items_collected
        WHEN stat_key = 'monsters_killed' THEN monsters_killed
        WHEN stat_key = 'gold_earned' THEN gold_earned
      END
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$;

-- Opprett en alternativ 'increment_stat' funksjon som kaller increment_user_stat
-- Dette er en ekstra sikkerhet i tilfelle det er uoppdaget kode som bruker dette navnet
CREATE OR REPLACE FUNCTION increment_stat(
  stat_name TEXT,
  increment_amount INT DEFAULT 1
) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Hent bruker-ID fra nåværende bruker
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Bruker ikke autentisert';
  END IF;
  
  -- Kall increment_user_stat med brukerens ID
  SELECT increment_user_stat(auth.uid(), stat_name, increment_amount) INTO result;
  
  RETURN result;
END;
$$; 