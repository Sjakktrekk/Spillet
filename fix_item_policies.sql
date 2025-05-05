-- Fjern eksisterende policies hvis det oppstår konflikter
DROP POLICY IF EXISTS "Kun admin kan opprette items" ON items;
DROP POLICY IF EXISTS "Kun admin kan oppdatere items" ON items;
DROP POLICY IF EXISTS "Kun admin kan slette items" ON items;

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

-- Bekreft at policies er satt opp korrekt
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'items'; 