-- Opprett shop_items tabell for å koble items med byer
CREATE TABLE IF NOT EXISTS shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    price INTEGER NOT NULL CHECK (price > 0),
    stock INTEGER DEFAULT 1 CHECK (stock >= 0),
    max_stock INTEGER DEFAULT 10 CHECK (max_stock >= stock),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, city_id)
);

-- Legg til respawn_timer og last_respawn kolonner hvis de ikke eksisterer
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shop_items' 
        AND column_name = 'respawn_timer'
    ) THEN
        ALTER TABLE shop_items 
        ADD COLUMN respawn_timer INTEGER DEFAULT 3600;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shop_items' 
        AND column_name = 'last_respawn'
    ) THEN
        ALTER TABLE shop_items 
        ADD COLUMN last_respawn TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Aktiver Row Level Security
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Policy for shop_items-tabellen
DO $$ 
BEGIN
    -- Slett eksisterende policies
    DROP POLICY IF EXISTS "Alle kan se butikkvarer" ON shop_items;
    DROP POLICY IF EXISTS "Bare admin kan endre butikkvarer" ON shop_items;

    -- Opprett nye policies
    CREATE POLICY "Alle kan se butikkvarer" ON shop_items
        FOR SELECT USING (true);

    CREATE POLICY "Autentiserte brukere kan endre butikkvarer" ON shop_items
        FOR ALL USING (auth.role() = 'authenticated');
END $$;

-- Opprett indekser for bedre ytelse
CREATE INDEX IF NOT EXISTS idx_shop_items_item_id ON shop_items(item_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_city_id ON shop_items(city_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_last_respawn ON shop_items(last_respawn);

-- Trigger for å oppdatere updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_shop_items_updated_at ON shop_items;
CREATE TRIGGER update_shop_items_updated_at
    BEFORE UPDATE ON shop_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 