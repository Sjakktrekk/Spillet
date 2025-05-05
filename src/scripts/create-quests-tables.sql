-- SQL-skript for å opprette quests-relaterte tabeller i Supabase
-- Kjør denne SQL-koden i Supabase SQL Editor

-- Sjekk og opprett admin_users tabell hvis den ikke finnes
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Dropp eksisterende tabeller hvis de finnes
DROP TABLE IF EXISTS quest_submissions CASCADE;
DROP TABLE IF EXISTS player_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;

-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    reward_gold INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_items JSONB DEFAULT '[]'::jsonb,
    location TEXT,
    time_limit INTEGER,
    quest_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create player_quests table
CREATE TABLE IF NOT EXISTS player_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, quest_id)
);

-- Create quest_submissions table
CREATE TABLE IF NOT EXISTS quest_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_quests_user_id ON player_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_player_quests_quest_id ON player_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_player_quests_status ON player_quests(status);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_user_id ON quest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_quest_id ON quest_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_status ON quest_submissions(status);

-- Enable RLS
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for own quests" ON player_quests;
DROP POLICY IF EXISTS "Enable insert access for own quests" ON player_quests;
DROP POLICY IF EXISTS "Enable update access for own quests" ON player_quests;
DROP POLICY IF EXISTS "Enable delete access for own quests" ON player_quests;
DROP POLICY IF EXISTS "Anyone can view quests" ON quests;
DROP POLICY IF EXISTS "Admin can manage quests" ON quests;
DROP POLICY IF EXISTS "Anyone can manage quests" ON quests;
DROP POLICY IF EXISTS "Users can view their own submissions" ON quest_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON quest_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON quest_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON quest_submissions;

-- Create policies for player_quests table
CREATE POLICY "Enable read access for own quests" ON player_quests
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Enable insert access for own quests" ON player_quests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for own quests" ON player_quests
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM admin_users))
    WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Enable delete access for own quests" ON player_quests
    FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM admin_users));

-- Create policies for quests table
CREATE POLICY "Anyone can view quests" ON quests
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can manage quests" ON quests
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM admin_users))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create policies for quest_submissions table
CREATE POLICY "Users can view their own submissions" ON quest_submissions
    FOR SELECT
    USING (user_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Users can create submissions" ON quest_submissions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage submissions" ON quest_submissions
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM admin_users))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quests_updated_at
    BEFORE UPDATE ON quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_submissions_updated_at
    BEFORE UPDATE ON quest_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 