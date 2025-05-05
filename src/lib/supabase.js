import { createClient } from '@supabase/supabase-js'

// Sjekk om vi allerede har en instans av Supabase-klienten
let supabaseClient = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL og Anon Key må være satt i miljøvariablene')
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  return supabaseClient
}

// Eksporter den ene instansen
export const supabase = getSupabaseClient()

// For å sikre at vi har riktige verdier, defineres de eksplisitt her
const supabaseUrl = 'https://eitbpkxpouhtsyytufqe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdGJwa3hwb3VodHN5eXR1ZnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MTAwNzUsImV4cCI6MjA2MDk4NjA3NX0.QqAT-f8rXWQqod-_clpUqxtf1WdTN-kroxiVoCs5kGA'

// For debugging
console.log('Supabase URL configurert:', supabaseUrl);

// Opprett service-rolleklient for administrativ tilgang
const createAdminClient = () => {
  const adminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdGJwa3hwb3VodHN5eXR1ZnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQxMDA3NSwiZXhwIjoyMDYwOTg2MDc1fQ.VWRkB8CAgfdhiCL2k73KtmkMy95j8m85pGOXdMmwZ08';
  return createClient(supabaseUrl, adminKey);
};

// Initialiser systemtabeller hvis de mangler
export const initializeDatabase = async () => {
  try {
    const adminClient = createAdminClient();
    
    // Prøv å spørre mot player_locations tabellen direkte for å se om den eksisterer
    const { data, error } = await adminClient
      .from('player_locations')
      .select('id')
      .limit(1);
    
    // Hvis vi får en 42P01 feil, eksisterer ikke tabellen
    if (error && error.code === '42P01') {
      console.log('player_locations tabell mangler, prøver å opprette...');
      
      // Forsøk å opprette tabellen
      const { error: createError } = await adminClient.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS player_locations (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL,
            city_id INTEGER NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE UNIQUE INDEX IF NOT EXISTS player_locations_user_id_idx 
          ON player_locations (user_id);
        `
      });
      
      if (createError) {
        console.error('Kunne ikke opprette player_locations tabell automatisk:', createError);
        console.log('Vennligst opprett tabellen manuelt i Supabase-grensesnittet');
      } else {
        console.log('player_locations tabell opprettet vellykket!');
      }
    } else if (error) {
      console.error('Annen feil ved sjekk av player_locations tabell:', error);
    } else {
      console.log('player_locations tabell finnes allerede');
    }
  } catch (err) {
    console.error('Generell feil ved initialisering av database:', err);
    console.log('Vennligst opprett tabellene manuelt i Supabase-grensesnittet');
  }
};

// Forsøk å initialisere databasen ved oppstart
initializeDatabase().catch(err => {
  console.warn('Kunne ikke initialisere database, fortsetter uten:', err);
}); 