-- Dropp eksisterende tabeller hvis de finnes
DROP TABLE IF EXISTS character_items;
DROP TABLE IF EXISTS items;

-- Opprett items-tabell
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  slot TEXT,
  rarity TEXT DEFAULT 'common',
  damage INTEGER DEFAULT 0,
  defense INTEGER DEFAULT 0,
  image_url TEXT,
  value INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opprett character_items-tabell (koblingstabell mellom karakterer og gjenstander)
CREATE TABLE character_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, item_id)
);

-- Aktiver Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;

-- Policy for items-tabellen
CREATE POLICY "Alle kan se gjenstander" ON items
  FOR SELECT USING (true);

CREATE POLICY "Bare admin kan endre gjenstander" ON items
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.role = 'admin'
    )
  );

-- Policy for character_items-tabellen
CREATE POLICY "Brukere kan se sine egne gjenstander" ON character_items
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      character_id IN (
        SELECT id FROM characters 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Brukere kan administrere sine egne gjenstander" ON character_items
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      character_id IN (
        SELECT id FROM characters 
        WHERE user_id = auth.uid()
      )
    )
  ); 