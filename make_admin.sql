-- Først sjekker vi om admin_users tabellen eksisterer, hvis ikke oppretter vi den
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sjekk om is_admin funksjonen eksisterer, hvis ikke oppretter vi den
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Legg til spesifisert bruker som admin
INSERT INTO admin_users (user_id)
VALUES ('4105763b-0041-498e-8d7f-a9448565903d')
ON CONFLICT (user_id) DO NOTHING;

-- Bekreft at brukeren er lagt til som admin
SELECT 'Brukeren med ID 4105763b-0041-498e-8d7f-a9448565903d og e-post msikkeland@gmail.com er nå administrator' AS message;

-- Vis alle administratorer for å bekrefte
SELECT au.user_id, u.email, au.created_at 
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id; 