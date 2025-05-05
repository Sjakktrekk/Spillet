-- SQL-skript for å opprette items-tabell i Supabase
-- Kjør denne SQL-koden i Supabase SQL Editor

-- Dropp eksisterende tabeller hvis de finnes
DROP TABLE IF EXISTS character_items CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS market_listings CASCADE;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    slot TEXT,
    rarity TEXT NOT NULL DEFAULT 'common',
    defense INTEGER DEFAULT 0,
    damage INTEGER DEFAULT 0,
    knowledge INTEGER DEFAULT 0,
    strength INTEGER DEFAULT 0,
    magic INTEGER DEFAULT 0,
    agility INTEGER DEFAULT 0,
    vitality_bonus INTEGER DEFAULT 0,
    value INTEGER DEFAULT 0,
    image_url TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    CONSTRAINT valid_slot CHECK (slot IN ('head', 'chest', 'pants', 'belt', 'boots', 'gloves', 'bracers', 'shoulder', 'mainHand', 'offHand', 'ring', 'amulet', 'misc', 'pet', 'weapon', 'twoHand'))
);

-- Create character_items junction table
CREATE TABLE IF NOT EXISTS character_items (
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    equipped BOOLEAN DEFAULT false,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    PRIMARY KEY (character_id, item_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Admin can manage items" ON items;

-- Create simplified policies for items table
CREATE POLICY "Anyone can view items" ON items
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage items" ON items
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS for character_items
ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;

-- Create policies for character_items
CREATE POLICY "Users can view their own character items" ON character_items
    FOR SELECT
    USING (
        character_id IN (
            SELECT id FROM characters WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own character items" ON character_items
    FOR ALL
    USING (
        character_id IN (
            SELECT id FROM characters WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        character_id IN (
            SELECT id FROM characters WHERE user_id = auth.uid()
        )
    );

-- Create market_listings table
CREATE TABLE IF NOT EXISTS market_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_name TEXT NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for market_listings
CREATE INDEX IF NOT EXISTS idx_market_listings_seller_id ON market_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_item_id ON market_listings(item_id);

-- Enable RLS for market_listings
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for market_listings
DROP POLICY IF EXISTS "Anyone can view market listings" ON market_listings;
DROP POLICY IF EXISTS "Users can create their own listings" ON market_listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON market_listings;
DROP POLICY IF EXISTS "Service role can manage market listings" ON market_listings;

-- Create policies for market_listings
CREATE POLICY "Anyone can view market listings" ON market_listings
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own listings" ON market_listings
    FOR INSERT
    WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can delete their own listings" ON market_listings
    FOR DELETE
    USING (seller_id = auth.uid());

CREATE POLICY "Service role can manage market listings" ON market_listings
    USING (auth.role() = 'service_role');

-- Create function for buying items from marketplace
CREATE OR REPLACE FUNCTION buy_market_item(
    p_listing_id UUID,
    p_buyer_id UUID,
    p_price INTEGER
) RETURNS void AS $$
DECLARE
    v_seller_id UUID;
    v_item_id UUID;
    v_buyer_character_id UUID;
    v_seller_character_id UUID;
BEGIN
    -- Get seller and item info from listing
    SELECT seller_id, item_id INTO v_seller_id, v_item_id
    FROM market_listings
    WHERE id = p_listing_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;
    
    -- Get character IDs
    SELECT id INTO v_buyer_character_id
    FROM characters
    WHERE user_id = p_buyer_id;
    
    SELECT id INTO v_seller_character_id
    FROM characters
    WHERE user_id = v_seller_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Character not found';
    END IF;
    
    -- Start transaction
    BEGIN
        -- Update gold for buyer
        UPDATE characters
        SET coins = coins - p_price
        WHERE id = v_buyer_character_id;
        
        -- Update gold for seller
        UPDATE characters
        SET coins = coins + p_price
        WHERE id = v_seller_character_id;
        
        -- Transfer item to buyer
        UPDATE items
        SET character_id = v_buyer_character_id
        WHERE id = v_item_id;
        
        -- Delete listing
        DELETE FROM market_listings
        WHERE id = p_listing_id;
        
        -- Commit transaction
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on error
            ROLLBACK;
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 