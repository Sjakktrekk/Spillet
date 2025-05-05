-- Aktiverer Row Level Security for admin_users-tabellen
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Opprett policy for at alle kan lese fra admin_users-tabellen
CREATE POLICY "Alle kan lese admin_users" 
ON admin_users FOR SELECT 
USING (true);

-- Opprett policy for at ingen kan slette admin_users unntatt via SQL (mer sikkerhet)
CREATE POLICY "Ingen kan slette admin_users via API" 
ON admin_users FOR DELETE 
USING (false);

-- Opprett policy for at ingen kan oppdatere admin_users unntatt via SQL (mer sikkerhet)
CREATE POLICY "Ingen kan oppdatere admin_users via API" 
ON admin_users FOR UPDATE 
USING (false);

-- Opprett policy for at ingen kan sette inn admin_users unntatt via SQL (mer sikkerhet)
CREATE POLICY "Ingen kan sette inn admin_users via API" 
ON admin_users FOR INSERT 
WITH CHECK (false); 