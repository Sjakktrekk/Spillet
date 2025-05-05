-- Fikser is_admin-funksjonen for å unngå tvetydig kolonnefeil
CREATE OR REPLACE FUNCTION is_admin(input_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = input_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Bekreft at funksjonen fungerer ved å teste med din bruker-ID
SELECT is_admin('4105763b-0041-498e-8d7f-a9448565903d') AS is_user_admin; 