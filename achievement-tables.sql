-- Achievement-relaterte tabeller med sikkerhetspolicyer

-- Sjekk om user_achievements tabellen eksisterer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_achievements') THEN
    CREATE TABLE public.user_achievements (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT false,
      date_completed TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      UNIQUE(user_id, achievement_id)
    );

    -- Legg til kommentar for tabellen
    COMMENT ON TABLE public.user_achievements IS 'Lagrer brukernes oppnådde prestasjoner (achievements)';

    -- Opprett indeks for raskere spørringer
    CREATE INDEX user_achievements_user_id_idx ON public.user_achievements(user_id);
  END IF;
END $$;

-- Sjekk om titles tabellen eksisterer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'titles') THEN
    CREATE TABLE public.titles (
      name TEXT PRIMARY KEY,
      description TEXT,
      rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
      source TEXT
    );

    -- Legg til kommentar for tabellen
    COMMENT ON TABLE public.titles IS 'Hovedtabell med alle tilgjengelige titler i spillet';
    
    -- Sett inn noen grunnleggende titler
    INSERT INTO public.titles (name, description, rarity, source) VALUES
      ('Eventyrsøkeren', 'Standard tittel for nye spillere', 'common', 'Grunnleggende'),
      ('Reisende', 'Besøkt 3 forskjellige byer', 'uncommon', 'Achievement: Reisende'),
      ('Den Sosiale', 'Sendt 50 meldinger i chat', 'uncommon', 'Achievement: Sosial sommerfugl'),
      ('Oppdragstaker', 'Fullført 5 oppdrag', 'rare', 'Achievement: Oppdragstaker'),
      ('Oppdragsmester', 'Fullført 10 oppdrag', 'epic', 'Achievement: Profesjonell oppdragstaker'),
      ('Samler', 'Samlet 5 sjeldne gjenstander', 'rare', 'Achievement: Samleren'),
      ('Den Dedikerte', 'Logget inn 10 ganger', 'uncommon', 'Achievement: Dedikert spiller'),
      ('Gullsmed', 'Tjent 1000 gull', 'epic', 'Achievement: Mesterhandler'),
      ('Monsterslakteren', 'Beseiret 100 monstre', 'legendary', 'Achievement: Monstertemmeren');
  END IF;
END $$;

-- Sjekk om user_titles tabellen eksisterer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_titles') THEN
    CREATE TABLE public.user_titles (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title_name TEXT NOT NULL REFERENCES public.titles(name) ON DELETE CASCADE,
      is_active BOOLEAN DEFAULT false,
      unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, title_name)
    );

    -- Legg til kommentar for tabellen
    COMMENT ON TABLE public.user_titles IS 'Kobler titler til brukere, med innstilling for aktiv tittel';

    -- Opprett indeks for raskere spørringer
    CREATE INDEX user_titles_user_id_idx ON public.user_titles(user_id);
  END IF;
END $$;

-- Sjekk om achievements tabellen eksisterer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievements') THEN
    CREATE TABLE public.achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      icon TEXT,
      reward TEXT,
      difficulty TEXT CHECK (difficulty IN ('lett', 'medium', 'vanskelig')),
      total INTEGER DEFAULT 1,
      stat_key TEXT
    );

    -- Legg til kommentar for tabellen
    COMMENT ON TABLE public.achievements IS 'Hovedtabell med alle achievements i spillet';
    
    -- Sett inn noen grunnleggende achievements
    INSERT INTO public.achievements (id, name, description, category, icon, reward, difficulty, total, stat_key) VALUES
      ('login1', 'Eventyrets begynnelse', 'Logg inn for første gang', 'generelt', '🏆', '50 XP', 'lett', 1, 'login_count'),
      ('login10', 'Dedikert spiller', 'Logg inn 10 ganger', 'generelt', '🌟', '100 XP, 50 Gull', 'medium', 10, 'login_count'),
      ('visit3', 'Reisende', 'Besøk 3 forskjellige byer', 'utforskning', '🧭', '100 XP, Tittel: Reisende', 'medium', 3, 'cities_visited'),
      ('quest5', 'Oppdragstaker', 'Fullfør 5 oppdrag', 'oppdrag', '📜', '150 XP, Tittel: Oppdragstaker', 'medium', 5, 'quests_completed'),
      ('quest10', 'Profesjonell oppdragstaker', 'Fullfør 10 oppdrag', 'oppdrag', '📚', '300 XP, Tittel: Oppdragsmester', 'vanskelig', 10, 'quests_completed'),
      ('item5', 'Samleren', 'Samle 5 sjeldne gjenstander', 'inventar', '💎', '200 XP, Tittel: Samler', 'medium', 5, 'items_collected'),
      ('msg50', 'Sosial sommerfugl', 'Send 50 meldinger i chat', 'sosialt', '💬', '100 XP, Tittel: Den Sosiale', 'medium', 50, 'messages_count'),
      ('gold1000', 'Mesterhandler', 'Tjen 1000 gull', 'handel', '💰', '250 XP, Tittel: Gullsmed', 'vanskelig', 1000, 'gold_earned'),
      ('monster100', 'Monstertemmeren', 'Beseire 100 monstre', 'kamp', '⚔️', '500 XP, Tittel: Monsterslakteren', 'vanskelig', 100, 'monsters_killed');
  END IF;

  -- Legg til stat_key kolonne hvis den ikke finnes
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'achievements' AND column_name = 'stat_key'
  ) THEN
    ALTER TABLE public.achievements ADD COLUMN stat_key TEXT;
    
    -- Oppdater eksisterende achievements med riktige stat_key verdier
    UPDATE public.achievements SET stat_key = 'login_count' WHERE id IN ('login1', 'login10');
    UPDATE public.achievements SET stat_key = 'cities_visited' WHERE id = 'visit3';
    UPDATE public.achievements SET stat_key = 'quests_completed' WHERE id IN ('quest5', 'quest10');
    UPDATE public.achievements SET stat_key = 'items_collected' WHERE id = 'item5';
    UPDATE public.achievements SET stat_key = 'messages_count' WHERE id = 'msg50';
    UPDATE public.achievements SET stat_key = 'gold_earned' WHERE id = 'gold1000';
    UPDATE public.achievements SET stat_key = 'monsters_killed' WHERE id = 'monster100';
  END IF;
END $$;

-- Sjekk om user_stats tabellen eksisterer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_stats') THEN
    CREATE TABLE public.user_stats (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      login_count INTEGER DEFAULT 0,
      quests_completed INTEGER DEFAULT 0,
      messages_count INTEGER DEFAULT 0,
      items_collected INTEGER DEFAULT 0,
      monsters_killed INTEGER DEFAULT 0,
      gold_earned INTEGER DEFAULT 0,
      cities_visited JSONB DEFAULT '[]'::jsonb,
      distance_traveled INTEGER DEFAULT 0,
      items_crafted INTEGER DEFAULT 0,
      resources_gathered INTEGER DEFAULT 0,
      battles_won INTEGER DEFAULT 0,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- Legg til kommentar for tabellen
    COMMENT ON TABLE public.user_stats IS 'Lagrer brukerstatistikk for achievements og spillprogresjon';

    -- Opprett indeks for raskere spørringer
    CREATE INDEX user_stats_user_id_idx ON public.user_stats(user_id);
  END IF;
  
  -- Legg til nye statistikkfelter hvis de ikke finnes
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_stats' AND column_name = 'distance_traveled'
  ) THEN
    ALTER TABLE public.user_stats ADD COLUMN distance_traveled INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_stats' AND column_name = 'items_crafted'
  ) THEN
    ALTER TABLE public.user_stats ADD COLUMN items_crafted INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_stats' AND column_name = 'resources_gathered'
  ) THEN
    ALTER TABLE public.user_stats ADD COLUMN resources_gathered INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_stats' AND column_name = 'battles_won'
  ) THEN
    ALTER TABLE public.user_stats ADD COLUMN battles_won INTEGER DEFAULT 0;
  END IF;
END $$;

-- Oppsett for Row-Level Security (RLS)
-- Dette gjør at brukere bare kan se og endre sine egne data

-- Aktiver RLS på user_achievements tabellen
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Opprett policy for user_achievements som kontrollerer tilgang
DROP POLICY IF EXISTS user_achievements_policy ON public.user_achievements;
CREATE POLICY user_achievements_policy ON public.user_achievements
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Aktiver RLS på user_titles tabellen
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;

-- Opprett policy for user_titles som kontrollerer tilgang
DROP POLICY IF EXISTS user_titles_policy ON public.user_titles;
CREATE POLICY user_titles_policy ON public.user_titles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Aktiver RLS på user_stats tabellen
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Opprett policy for user_stats som kontrollerer tilgang
DROP POLICY IF EXISTS user_stats_policy ON public.user_stats;
CREATE POLICY user_stats_policy ON public.user_stats
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Gi anonyme brukere tilgang til å lese alle achievements og titler
DROP POLICY IF EXISTS achievements_anon_policy ON public.achievements;
CREATE POLICY achievements_anon_policy ON public.achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS titles_anon_policy ON public.titles;
CREATE POLICY titles_anon_policy ON public.titles FOR SELECT USING (true); 