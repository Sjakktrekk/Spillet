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
      total INTEGER DEFAULT 1
    );

    -- Legg til kommentar for tabellen
    COMMENT ON TABLE public.achievements IS 'Hovedtabell med alle achievements i spillet';
    
    -- Sett inn noen grunnleggende achievements
    INSERT INTO public.achievements (id, name, description, category, icon, reward, difficulty, total) VALUES
      ('login1', 'Eventyrets begynnelse', 'Logg inn for første gang', 'generelt', '🏆', '50 XP', 'lett', 1),
      ('login10', 'Dedikert spiller', 'Logg inn 10 ganger', 'generelt', '🌟', '100 XP, 50 Gull', 'medium', 10),
      ('visit3', 'Reisende', 'Besøk 3 forskjellige byer', 'utforskning', '🧭', '100 XP, Tittel: Reisende', 'medium', 3),
      ('quest5', 'Oppdragstaker', 'Fullfør 5 oppdrag', 'oppdrag', '📜', '150 XP, Tittel: Oppdragstaker', 'medium', 5),
      ('quest10', 'Profesjonell oppdragstaker', 'Fullfør 10 oppdrag', 'oppdrag', '📚', '300 XP, Tittel: Oppdragsmester', 'vanskelig', 10),
      ('item5', 'Samleren', 'Samle 5 sjeldne gjenstander', 'inventar', '💎', '200 XP, Tittel: Samler', 'medium', 5),
      ('msg50', 'Sosial sommerfugl', 'Send 50 meldinger i chat', 'sosialt', '💬', '100 XP, Tittel: Den Sosiale', 'medium', 50),
      ('gold1000', 'Mesterhandler', 'Tjen 1000 gull', 'handel', '💰', '250 XP, Tittel: Gullsmed', 'vanskelig', 1000),
      ('monster100', 'Monstertemmeren', 'Beseire 100 monstre', 'kamp', '⚔️', '500 XP, Tittel: Monsterslakteren', 'vanskelig', 100);
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
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- Legg til kommentar for tabellen
    COMMENT ON TABLE public.user_stats IS 'Lagrer brukerstatistikk for achievements og spillprogresjon';

    -- Opprett indeks for raskere spørringer
    CREATE INDEX user_stats_user_id_idx ON public.user_stats(user_id);
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