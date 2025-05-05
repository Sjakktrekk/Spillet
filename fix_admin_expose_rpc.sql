-- Fjern eksisterende policies først for å unngå avhengighetsproblemer
DROP POLICY IF EXISTS "Kun admin kan opprette items" ON items;
DROP POLICY IF EXISTS "Kun admin kan oppdatere items" ON items;
DROP POLICY IF EXISTS "Kun admin kan slette items" ON items;

-- Dropp alle versjoner av funksjonen for å være sikker
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_admin(input_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Oppretter admin_users tabell hvis den ikke finnes
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legg til admin-brukeren
INSERT INTO admin_users (user_id)
VALUES ('4105763b-0041-498e-8d7f-a9448565903d')
ON CONFLICT (user_id) DO NOTHING;

-- Oppretter en sikker RPC-versjon som kan kalles fra klienten
-- Denne returnerer om nåværende bruker er admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gi REST API tilgang til is_admin funksjonen
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- Oppretter en intern funksjon for bruk i policies
CREATE OR REPLACE FUNCTION is_admin_internal(input_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = input_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aktiver Row Level Security for items-tabellen
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Opprett policy for at alle kan se gjenstander (kun hvis den ikke allerede finnes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'items' AND policyname = 'Alle kan se items'
    ) THEN
        EXECUTE 'CREATE POLICY "Alle kan se items" ON items FOR SELECT USING (true)';
    END IF;
END
$$;

-- Opprett policy for å tillate INSERT bare for admin-brukere
CREATE POLICY "Kun admin kan opprette items" 
ON items FOR INSERT 
TO authenticated 
WITH CHECK (is_admin_internal(auth.uid()));

-- Opprett policy for å tillate UPDATE bare for admin-brukere
CREATE POLICY "Kun admin kan oppdatere items" 
ON items FOR UPDATE 
TO authenticated 
USING (is_admin_internal(auth.uid()));

-- Opprett policy for å tillate DELETE bare for admin-brukere
CREATE POLICY "Kun admin kan slette items" 
ON items FOR DELETE 
TO authenticated 
USING (is_admin_internal(auth.uid()));

-- Legg til kommentar for at funksjonen vises bedre i Supabase UI
COMMENT ON FUNCTION is_admin() IS 'Sjekker om gjeldende bruker er administrator';

-- Bekreft oppsett
SELECT 'Oppsett av RPC-funksjon og tilgangskontroll fullført. is_admin-funksjonen er nå tilgjengelig via REST API.' AS message; 