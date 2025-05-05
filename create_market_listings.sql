-- Opprett market_listings tabell
CREATE TABLE IF NOT EXISTS market_listings (
    id SERIAL PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_name TEXT NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id),
    price INTEGER NOT NULL CHECK (price > 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opprett funksjonen for kjøp av gjenstander
CREATE OR REPLACE FUNCTION buy_market_item(
    p_listing_id INTEGER,
    p_buyer_id UUID,
    p_price INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_seller_id UUID;
    v_item_id UUID;
BEGIN
    -- Hent selger-ID og gjenstand-ID
    SELECT seller_id, item_id INTO v_seller_id, v_item_id
    FROM market_listings
    WHERE id = p_listing_id;
    
    -- Sjekk om listingen eksisterer
    IF v_seller_id IS NULL THEN
        RAISE EXCEPTION 'Listing % finnes ikke', p_listing_id;
    END IF;
    
    -- Oppdater kjøperens mynter (reduser)
    UPDATE characters
    SET coins = coins - p_price
    WHERE user_id = p_buyer_id;
    
    -- Oppdater selgerens mynter (øk)
    UPDATE characters
    SET coins = coins + p_price
    WHERE user_id = v_seller_id;
    
    -- Legg til gjenstanden i kjøperens inventar
    INSERT INTO character_items (character_id, item_id, equipped, quantity)
    SELECT c.id, v_item_id, false, 1
    FROM characters c
    WHERE c.user_id = p_buyer_id;
    
    -- Slett listingen
    DELETE FROM market_listings WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql; 