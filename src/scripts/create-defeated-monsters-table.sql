-- SQL-skript for å opprette defeated_monsters tabell i Supabase
-- Kjør denne SQL-koden i Supabase SQL Editor

-- Dropp eksisterende tabell hvis den finnes
DROP TABLE IF EXISTS defeated_monsters CASCADE;

-- Opprett defeated_monsters-tabell
CREATE TABLE IF NOT EXISTS defeated_monsters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monster_id UUID NOT NULL REFERENCES monsters(id) ON DELETE CASCADE,
  monster_level INTEGER NOT NULL CHECK (monster_level >= 1 AND monster_level <= 10),
  defeated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  respawn_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE (user_id, monster_id)
);

-- Opprett indekser for raskere oppslag
CREATE INDEX IF NOT EXISTS idx_defeated_monsters_user_id ON defeated_monsters(user_id);
CREATE INDEX IF NOT EXISTS idx_defeated_monsters_monster_id ON defeated_monsters(monster_id);
CREATE INDEX IF NOT EXISTS idx_defeated_monsters_respawn ON defeated_monsters(respawn_at);

-- Aktiver Row Level Security
ALTER TABLE defeated_monsters ENABLE ROW LEVEL SECURITY;

-- Opprett policies for tabellen
CREATE POLICY "Users can view their own defeated monsters" ON defeated_monsters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own defeated monsters" ON defeated_monsters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own defeated monsters" ON defeated_monsters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own defeated monsters" ON defeated_monsters
  FOR DELETE USING (auth.uid() = user_id);

-- Opprett funksjon for å oppdatere respawn_at når en bruker beseirer et monster
CREATE OR REPLACE FUNCTION set_monster_respawn() RETURNS TRIGGER AS $$
BEGIN
  -- 10 timer respawn-tid (kan justeres etter behov)
  NEW.respawn_at := NEW.defeated_at + INTERVAL '10 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Opprett trigger som kaller funksjonen før innsetting
CREATE TRIGGER before_monster_defeat_insert
  BEFORE INSERT ON defeated_monsters
  FOR EACH ROW
  EXECUTE FUNCTION set_monster_respawn();

-- Opprett funksjon for å sjekke om et monster kan kjempes mot igjen
CREATE OR REPLACE FUNCTION can_fight_monster(p_user_id UUID, p_monster_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  monster_respawn TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Sjekk om monster finnes i defeated_monsters tabellen for brukeren
  SELECT respawn_at INTO monster_respawn
  FROM defeated_monsters
  WHERE user_id = p_user_id AND monster_id = p_monster_id;
  
  -- Hvis ingen rad funnet, kan monsteret kjempes mot
  IF monster_respawn IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Sjekk om respawn-tiden har passert
  RETURN monster_respawn <= NOW();
END;
$$ LANGUAGE plpgsql; 