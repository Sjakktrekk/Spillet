-- Aktiver Row Level Security for items-tabellen
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Opprett policy for å tillate SELECT for alle
CREATE POLICY "Alle kan se items" 
ON items FOR SELECT 
USING (true);

-- Opprett en admin_users tabell for å spore admin-brukere hvis den ikke finnes
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legg til en funksjon for å sjekke om en bruker er admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Opprett policy for å tillate INSERT bare for admin-brukere
CREATE POLICY "Kun admin kan opprette items" 
ON items FOR INSERT 
TO authenticated 
WITH CHECK (is_admin(auth.uid()));

-- Opprett policy for å tillate UPDATE bare for admin-brukere
CREATE POLICY "Kun admin kan oppdatere items" 
ON items FOR UPDATE 
TO authenticated 
USING (is_admin(auth.uid()));

-- Opprett policy for å tillate DELETE bare for admin-brukere
CREATE POLICY "Kun admin kan slette items" 
ON items FOR DELETE 
TO authenticated 
USING (is_admin(auth.uid()));

-- Hvis du vil legge til din bruker som admin, kjør denne spørringen med din bruker-id:
-- INSERT INTO admin_users (user_id) VALUES ('din-bruker-id-her');

-- Du kan også lage en funksjon for å gjøre brukere til admin:
CREATE OR REPLACE FUNCTION make_user_admin(p_email TEXT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Finn bruker-ID basert på e-post
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Ingen bruker funnet med e-post: %', p_email;
    END IF;
    
    -- Legg til bruker i admin_users-tabellen hvis den ikke allerede finnes
    INSERT INTO admin_users (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql; 