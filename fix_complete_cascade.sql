-- Sjekk om admin_users-tabellen eksisterer, hvis ikke, opprett den
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users'
    ) THEN
        CREATE TABLE admin_users (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Fjern eksisterende policies først
DROP POLICY IF EXISTS "Kun admin kan opprette items" ON items;
DROP POLICY IF EXISTS "Kun admin kan oppdatere items" ON items;
DROP POLICY IF EXISTS "Kun admin kan slette items" ON items;

-- Nå kan vi trygt slette funksjonen (bruker CASCADE for sikkerhetsskyld)
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;

-- Opprett is_admin-funksjonen på nytt med det nye parameternavnet
CREATE OR REPLACE FUNCTION is_admin(input_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = input_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Legg til spesifisert bruker som admin
INSERT INTO admin_users (user_id)
VALUES ('4105763b-0041-498e-8d7f-a9448565903d')
ON CONFLICT (user_id) DO NOTHING;

-- Opprett policy for at alle kan se gjenstander
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'items' AND policyname = 'Alle kan se items'
    ) THEN
        CREATE POLICY "Alle kan se items" 
        ON items FOR SELECT 
        USING (true);
    END IF;
END
$$;

-- Aktiver Row Level Security for items-tabellen
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

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

-- Bekreft oppsett
SELECT 'Oppsett fullført. Brukeren med ID 4105763b-0041-498e-8d7f-a9448565903d er nå admin.' AS message; 