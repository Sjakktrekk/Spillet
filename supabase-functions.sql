-- Funksjon for å inkrementere brukerstatistikk
-- Denne brukes av useAchievementTracker.jsx for å oppdatere user_stats tabellen

-- Slett gamle funksjoner først
DROP FUNCTION IF EXISTS increment_user_stat(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS add_to_user_stat_array(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS add_city_to_visited(UUID, TEXT);

CREATE OR REPLACE FUNCTION increment_user_stat(
  user_id_param UUID,
  stat_key TEXT,
  increment_amount INT DEFAULT 1
) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $increment_user_stat$
DECLARE
  result JSONB;
  current_value INT;
  updated_value INT;
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
      WHEN stat_key = 'distance_traveled' THEN distance_traveled
      WHEN stat_key = 'items_crafted' THEN items_crafted
      WHEN stat_key = 'resources_gathered' THEN resources_gathered
      WHEN stat_key = 'battles_won' THEN battles_won
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
      distance_traveled,
      items_crafted,
      resources_gathered,
      battles_won,
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
      CASE WHEN stat_key = 'distance_traveled' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'items_crafted' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'resources_gathered' THEN increment_amount ELSE 0 END,
      CASE WHEN stat_key = 'battles_won' THEN increment_amount ELSE 0 END,
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
        WHEN stat_key = 'distance_traveled' THEN distance_traveled
        WHEN stat_key = 'items_crafted' THEN items_crafted
        WHEN stat_key = 'resources_gathered' THEN resources_gathered
        WHEN stat_key = 'battles_won' THEN battles_won
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
      distance_traveled = CASE WHEN stat_key = 'distance_traveled' THEN distance_traveled + increment_amount ELSE distance_traveled END,
      items_crafted = CASE WHEN stat_key = 'items_crafted' THEN items_crafted + increment_amount ELSE items_crafted END,
      resources_gathered = CASE WHEN stat_key = 'resources_gathered' THEN resources_gathered + increment_amount ELSE resources_gathered END,
      battles_won = CASE WHEN stat_key = 'battles_won' THEN battles_won + increment_amount ELSE battles_won END,
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
        WHEN stat_key = 'distance_traveled' THEN distance_traveled
        WHEN stat_key = 'items_crafted' THEN items_crafted
        WHEN stat_key = 'resources_gathered' THEN resources_gathered
        WHEN stat_key = 'battles_won' THEN battles_won
      END
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$increment_user_stat$;

-- Funksjon for å oppdatere cities_visited i user_stats
-- Spesialhåndtering for byer siden det er en JSONB-array

CREATE OR REPLACE FUNCTION add_city_to_visited(
  user_id_param UUID,
  city_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $add_city_to_visited$
DECLARE
  current_cities JSONB;
  result JSONB;
BEGIN
  -- Hent nåværende byer for brukeren
  SELECT cities_visited INTO current_cities
  FROM public.user_stats
  WHERE user_id = user_id_param;
  
  -- Hvis brukeren ikke har statistikk ennå
  IF current_cities IS NULL THEN
    -- Opprett en ny rad med initiell by
    INSERT INTO public.user_stats (
      user_id,
      cities_visited,
      last_updated
    ) VALUES (
      user_id_param,
      jsonb_build_array(city_name),
      NOW()
    )
    RETURNING jsonb_build_object(
      'user_id', user_id,
      'cities_visited', cities_visited
    ) INTO result;
  ELSE
    -- Sjekk om byen allerede er i listen
    IF NOT current_cities ? city_name THEN
      -- Oppdater eksisterende liste med ny by
      UPDATE public.user_stats
      SET 
        cities_visited = cities_visited || jsonb_build_array(city_name),
        last_updated = NOW()
      WHERE user_id = user_id_param
      RETURNING jsonb_build_object(
        'user_id', user_id,
        'cities_visited', cities_visited
      ) INTO result;
    ELSE
      -- Byen er allerede i listen, returner nåværende status
      SELECT jsonb_build_object(
        'user_id', user_id,
        'cities_visited', cities_visited,
        'message', 'City already visited'
      ) INTO result
      FROM public.user_stats
      WHERE user_id = user_id_param;
    END IF;
  END IF;
  
  RETURN result;
END;
$add_city_to_visited$; 