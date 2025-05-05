-- Oppretter admin_users-tabellen hvis den ikke finnes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_users') THEN
        CREATE TABLE admin_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            UNIQUE(user_id)
        );
    END IF;
END $$;

-- Legg til updated_at kolonne hvis den ikke finnes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;
    END IF;
END $$;

-- Sett opp kommentarer for tabellen og kolonner
COMMENT ON TABLE admin_users IS 'Tabell for administrator-brukere';
COMMENT ON COLUMN admin_users.id IS 'Unik ID for administrator-oppføringen';
COMMENT ON COLUMN admin_users.user_id IS 'Referanse til bruker-ID i auth.users';
COMMENT ON COLUMN admin_users.created_at IS 'Tidspunkt for opprettelse';
COMMENT ON COLUMN admin_users.updated_at IS 'Tidspunkt for siste oppdatering';

-- Legg til din bruker som administrator
INSERT INTO admin_users (user_id)
VALUES ('4105763b-0041-498e-8d7f-a9448565903d')
ON CONFLICT (user_id) DO NOTHING;

-- Opprett Row Level Security policies hvis de ikke finnes allerede
DO $$
BEGIN
    -- Aktiver RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'admin_users' AND rowsecurity = true
    ) THEN
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Opprett policies hvis de ikke finnes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_select_policy'
    ) THEN
        CREATE POLICY admin_users_select_policy ON admin_users
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_insert_policy'
    ) THEN
        CREATE POLICY admin_users_insert_policy ON admin_users
            FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_update_policy'
    ) THEN
        CREATE POLICY admin_users_update_policy ON admin_users
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'admin_users_delete_policy'
    ) THEN
        CREATE POLICY admin_users_delete_policy ON admin_users
            FOR DELETE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Oppretter funksjonen is_admin for bruk i andre policies
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sett opp REST-endepunkt for is_admin-funksjonen
COMMENT ON FUNCTION is_admin IS 'Sjekker om gjeldende bruker er administrator';

-- Gi tilgang til funksjonen via REST API
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO anon; 