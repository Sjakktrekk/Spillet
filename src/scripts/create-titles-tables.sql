-- SQL-skript for å opprette titles-relaterte tabeller i Supabase
-- Kjør denne SQL-koden i Supabase SQL Editor

-- Dropp eksisterende tabeller hvis de finnes
DROP TABLE IF EXISTS user_titles CASCADE;
DROP TABLE IF EXISTS titles CASCADE;

-- Create titles table
CREATE TABLE IF NOT EXISTS titles (
    name TEXT PRIMARY KEY,
    description TEXT,
    rarity TEXT NOT NULL DEFAULT 'common',
    source TEXT,
    CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

-- Create user_titles table
CREATE TABLE IF NOT EXISTS user_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title_name TEXT NOT NULL REFERENCES titles(name) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(user_id, title_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_titles_title_name ON user_titles(title_name);

-- Enable RLS
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_titles table
CREATE POLICY "Users can view their own titles" ON user_titles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own titles" ON user_titles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own titles" ON user_titles
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own titles" ON user_titles
    FOR DELETE
    USING (user_id = auth.uid());

-- Create policies for titles table
CREATE POLICY "Anyone can view titles" ON titles
    FOR SELECT
    USING (true);

-- Insert default titles
INSERT INTO titles (name, description, rarity, source) VALUES
    ('Eventyrsøkeren', 'Standard tittel for nye spillere', 'common', 'Grunnleggende'),
    ('Reisende', 'Besøkt 3 forskjellige byer', 'uncommon', 'Achievement: Reisende'),
    ('Den Sosiale', 'Sendt 50 meldinger i chat', 'uncommon', 'Achievement: Sosial sommerfugl'),
    ('Oppdragstaker', 'Fullført 5 oppdrag', 'rare', 'Achievement: Oppdragstaker'),
    ('Oppdragsmester', 'Fullført 10 oppdrag', 'epic', 'Achievement: Profesjonell oppdragstaker'),
    ('Samler', 'Samlet 5 sjeldne gjenstander', 'rare', 'Achievement: Samleren'),
    ('Den Dedikerte', 'Logget inn 10 ganger', 'uncommon', 'Achievement: Dedikert spiller'),
    ('Gullsmed', 'Tjent 1000 gull', 'epic', 'Achievement: Mesterhandler'),
    ('Monsterslakteren', 'Beseiret 100 monstre', 'legendary', 'Achievement: Monstertemmeren')
ON CONFLICT (name) DO NOTHING; 