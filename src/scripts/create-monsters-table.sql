-- SQL-skript for å opprette monsters-tabell i Supabase
-- Kjør denne SQL-koden i Supabase SQL Editor

-- Dropp eksisterende tabell hvis den finnes
DROP TABLE IF EXISTS monsters CASCADE;

-- Opprett monsters-tabell
CREATE TABLE IF NOT EXISTS monsters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
  health INTEGER NOT NULL,
  damage INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  gold_reward_min INTEGER NOT NULL,
  gold_reward_max INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Opprett indeks for raskere oppslag
CREATE INDEX IF NOT EXISTS idx_monsters_level ON monsters(level);

-- Aktiver Row Level Security
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;

-- Dropp eksisterende policy
DROP POLICY IF EXISTS "Anyone can view monsters" ON monsters;
DROP POLICY IF EXISTS "Admin can manage monsters" ON monsters;

-- Opprett policy for monsters-tabellen
CREATE POLICY "Anyone can view monsters" ON monsters
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage monsters" ON monsters
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.role = 'admin'
    )
  );

-- Legg til standard monstre for hvert nivå
INSERT INTO monsters (name, description, level, health, damage, xp_reward, gold_reward_min, gold_reward_max, image_url)
VALUES
  ('Tallslimen', 'En merkelig slim som har tatt form av et tall. Det er ganske svakt, men kan overraske deg.', 1, 50, 5, 10, 5, 10, NULL),
  ('Minusulven', 'En liten ulv som bruker subtraksjoner for å svekke motstanderne sine.', 2, 80, 8, 25, 8, 15, NULL),
  ('Addisjonsgoblin', 'Denne goblinen er kjent for å legge sammen skade for å overrumple fiender.', 3, 120, 12, 45, 10, 20, NULL),
  ('Multiplikasjonstrollet', 'Et troll som forstår kraften i multiplikasjon, og bruker den i kamp.', 4, 160, 15, 70, 15, 25, NULL),
  ('Divisjonsspøkelset', 'Dette spøkelset deler opp motstandere med sine divisjonsangrep.', 5, 200, 18, 100, 20, 35, NULL),
  ('Algebraisk Slange', 'En farlig slange som kan manipulere tall med avansert algebra.', 6, 250, 22, 140, 25, 40, NULL),
  ('Geometrigorgonet', 'Et skrekkelig vesen med evnen til å bruke geometri som et våpen.', 7, 300, 26, 185, 30, 50, NULL),
  ('Statistikkskyggen', 'En mørk skygge som bruker sannsynlighet og statistikk for å forutse angrep.', 8, 350, 30, 240, 40, 60, NULL),
  ('Kalkulus Kjempe', 'En enorm kjempe som kan bøye rommet med sine kalkulus-inspirerte angrep.', 9, 400, 35, 300, 50, 75, NULL),
  ('Matematikkens Magidrake', 'Den mektigste av alle talløyene. Bare de sterkeste matematikere har håp om å beseire denne fryktsomme dragen.', 10, 500, 40, 400, 60, 100, NULL); 