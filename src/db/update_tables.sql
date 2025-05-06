-- Legg til coins-kolonne i characters-tabellen hvis den ikke finnes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'characters' 
        AND column_name = 'coins'
    ) THEN
        ALTER TABLE characters ADD COLUMN coins INTEGER DEFAULT 0;
    END IF;
END $$;

-- Opprett monster_defeats-tabellen hvis den ikke finnes
CREATE TABLE IF NOT EXISTS monster_defeats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monster_id UUID NOT NULL,
    defeated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, monster_id)
);

-- Sjekk om vi trenger å legge til type-kolonnen i monsters-tabellen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'monsters' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE monsters ADD COLUMN type TEXT DEFAULT 'math';
    END IF;
END $$;

-- Oppdater eksisterende monstre til å ha type 'math' hvis de ikke har en type
UPDATE monsters SET type = 'math' WHERE type IS NULL;

-- Legg til ordmonstre hvis de ikke finnes
INSERT INTO monsters (name, level, health, damage, xp_reward, gold_reward_min, gold_reward_max, image_url, description, type)
SELECT 
    'Ordvokteren', 1, 50, 5, 15, 5, 10, '/monsters/word1.png', 'En liten ordvokter som tester dine grunnleggende grammatikkferdigheter.', 'word'
WHERE NOT EXISTS (
    SELECT 1 FROM monsters WHERE name = 'Ordvokteren' AND type = 'word'
);

INSERT INTO monsters (name, level, health, damage, xp_reward, gold_reward_min, gold_reward_max, image_url, description, type)
SELECT 
    'Setningsbyggeren', 2, 75, 8, 25, 8, 15, '/monsters/word2.png', 'En middels ordvokter som utfordrer din setningsforståelse.', 'word'
WHERE NOT EXISTS (
    SELECT 1 FROM monsters WHERE name = 'Setningsbyggeren' AND type = 'word'
);

INSERT INTO monsters (name, level, health, damage, xp_reward, gold_reward_min, gold_reward_max, image_url, description, type)
SELECT 
    'Grammatikkdraken', 3, 100, 12, 40, 12, 20, '/monsters/word3.png', 'En mektig ordvokter som tester dine avanserte grammatikkferdigheter.', 'word'
WHERE NOT EXISTS (
    SELECT 1 FROM monsters WHERE name = 'Grammatikkdraken' AND type = 'word'
);

-- Kommentar om bruk
COMMENT ON TABLE monster_defeats IS 'Lagrer informasjon om monstre som er beseiret av spillere';
COMMENT ON COLUMN monsters.type IS 'Type monster (math, word, etc.)'; 