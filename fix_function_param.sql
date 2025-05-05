-- Først sletter vi den eksisterende funksjonen
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Så oppretter vi funksjonen på nytt med det nye parameternavnet
CREATE OR REPLACE FUNCTION is_admin(input_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = input_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Bekreft at funksjonen fungerer
SELECT 'Funksjonen er nå oppdatert' AS message; 